from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain.agents import AgentExecutor
from langchain_cohere.react_multi_hop.agent import create_cohere_react_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_cohere import ChatCohere
from langchain_community.tools.tavily_search import TavilySearchResults
from pydantic import BaseModel, Field
import os
import logging
import json
from typing import List, Optional, Dict

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

class TavilySearchInput(BaseModel):
    query: str = Field(description="Query to search the internet with")

class FactCheckResult(BaseModel):
    is_factual: bool
    confidence: float
    reasoning: str
    sources: Optional[List[Dict[str, str]]] = Field(default_factory=list)

def extract_tavily_sources(agent_result: dict) -> List[str]:
    """
    Extracts source URLs from Tavily search results in the agent's intermediate steps
    """
    sources = set()  # Use a set to avoid duplicates
    print("RESULT", agent_result)
    # Look through intermediate steps for Tavily search results
    for source in agent_result:
        source.append(source)
    
    return list(sources)

def analyze_factuality(text: str, llm: ChatCohere) -> FactCheckResult:
    """
    Analyzes if a given text is saying that a certain statement is false or true.
    Returns a structured response indicating whether the text claims something is true or false.
    """
    prompt = f"""
    You are an expert at analyzing statements. Your task is to determine if the following text is stating that something is true or false.
    DO NOT try to verify if the information itself is true - only analyze if the text is SAYING it's true or false.

    Respond in valid JSON format with these fields:
    - is_factual: boolean (true if the text is saying something is true/correct, false if the text is saying something is false/incorrect)
    - confidence: float between 0 and 1 (how clear is the text in making this true/false statement)
    - reasoning: brief explanation of what words/phrases in the text indicate it's saying true or false
    - sources: array of dictionaries (list of sources mentioned in the text, or empty array if none, each with 'url' and 'content' keys)

    Text to analyze:
    {text}

    JSON Response:"""

    response = llm.invoke(prompt)
    
    try:
        analysis = json.loads(response.content)
        if 'sources' not in analysis:
            analysis['sources'] = []
        else:
            # Ensure sources are in the correct format
            if isinstance(analysis['sources'], list):
                analysis['sources'] = [
                    {"url": source.get("url", "No URL"), "content": source.get("content", "No content")}
                    if isinstance(source, dict) else {"url": source, "content": "No content"}
                    for source in analysis['sources']
                ]
            else:
                # If sources is not a list, initialize it as empty
                analysis['sources'] = []

        return FactCheckResult(**analysis)
    except Exception as e:
        logger.error(f"Error parsing Cohere response: {e}")
        return FactCheckResult(
            is_factual=False,
            confidence=0.0,
            reasoning=f"Error analyzing response: {str(e)}",
            sources=[]
        )

def create_search_agent(stance: str):
    """
    Creates a specialized agent for searching either supporting or opposing evidence
    
    Args:
        stance: Either "supporting" or "opposing" to determine the agent's perspective
    """
    # Initialize the internet search tool
    internet_search = TavilySearchResults(include_answer=True)
    internet_search.name = "internet_search"
    internet_search.description = "Returns relevant document snippets from the internet"
    internet_search.args_schema = TavilySearchInput

    # Initialize Cohere LLM
    llm = ChatCohere(
        cohere_api_key=os.environ['COHERE_API_KEY'],
        model="command-r-plus-08-2024",
        temperature=0
    )

    # Create stance-specific prompt
    if stance == "supporting":
        prompt_text = """
        You are an expert fact-checker searching for evidence that SUPPORTS the given claim.
        Focus on finding credible sources that verify or validate the statement.
        Provide a detailed analysis of why the evidence supports the claim.
        
        User query: {input}
        
        Respond with:
        1. Your conclusion about whether the claim is supported
        2. Confidence level (0-1)
        3. Reasoning based on the sources
        """
    else:
        prompt_text = """
        You are an expert fact-checker searching for evidence that OPPOSES or CONTRADICTS the given claim.
        Focus on finding credible sources that challenge or disprove the statement.
        Provide a detailed analysis of why the evidence contradicts the claim.
        
        User query: {input}
        
        Respond with:
        1. Your conclusion about whether the claim is contradicted
        2. Confidence level (0-1)
        3. Reasoning based on the sources
        """

    prompt = ChatPromptTemplate.from_template(prompt_text)
    
    # Create the agent
    agent = create_cohere_react_agent(llm=llm, tools=[internet_search], prompt=prompt)
    return AgentExecutor(agent=agent, tools=[internet_search], verbose=True)

def parse_agent_response(response: dict) -> FactCheckResult:
    """
    Parses the agent's response into a structured format
    """
    try:
        # Extract the output and citations from the response
        output = response.get("output", "")
        citations = response.get("citations", [])

        # Use the existing factuality analyzer to process the output
        llm = ChatCohere(cohere_api_key=os.environ['COHERE_API_KEY'], model="command-r-plus-08-2024", temperature=0)
        factuality = analyze_factuality(output, llm)

        # Extract sources from citations
        sources = []
        print("SOURCES\n\n")
        for citation in citations:
            print(citation)
            for document in citation.documents:
                print(document)
                sources.append({
                    "url": document.get("url", "No URL"),
                    "content": document.get("content", "No content")
                })

        return FactCheckResult(
            is_factual=factuality.is_factual,
            confidence=factuality.confidence,
            reasoning=factuality.reasoning,
            sources=sources
        )
    except Exception as e:
        logger.error(f"Error parsing agent response: {e}")
        return FactCheckResult(
            is_factual=False,
            confidence=0.0,
            reasoning=f"Error parsing response: {str(e)}",
            sources=[]
        )

@app.route('/invoke', methods=['POST'])
def invoke_dual_agents():
    try:
        # Get the JSON data from the request
        data = request.json
        input_data = TavilySearchInput(**data)
        
        # Create agents for both perspectives
        supporting_agent = create_search_agent("supporting")
        opposing_agent = create_search_agent("opposing")
        
        # Run both agents in parallel (in a production environment, you might want to use async)
        supporting_result = supporting_agent.invoke({"input": input_data.query})
        opposing_result = opposing_agent.invoke({"input": input_data.query})
        
        # Parse results
        supporting_analysis = parse_agent_response(supporting_result)
        opposing_analysis = parse_agent_response(opposing_result)
        
        # Combine results
        response_data = {
            "query": input_data.query,
            "supporting_evidence": {
                "is_factual": supporting_analysis.is_factual,
                "confidence": supporting_analysis.confidence,
                "reasoning": supporting_analysis.reasoning,
                "sources": supporting_analysis.sources
            },
            "opposing_evidence": {
                "is_factual": opposing_analysis.is_factual,
                "confidence": opposing_analysis.confidence,
                "reasoning": opposing_analysis.reasoning,
                "sources": opposing_analysis.sources
            },
            "overall_assessment": {
                "conflicting_evidence": supporting_analysis.confidence > 0.5 and opposing_analysis.confidence > 0.5,
                "confidence_differential": abs(supporting_analysis.confidence - opposing_analysis.confidence),
                "recommendation": "needs_further_investigation" if (supporting_analysis.confidence > 0.5 and opposing_analysis.confidence > 0.5) else "supported" if supporting_analysis.confidence > opposing_analysis.confidence else "contradicted"
            }
        }
        
        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Error in dual agent invocation: {str(e)}")
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001)