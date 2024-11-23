from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS for handling cross-origin requests
from langchain.agents import AgentExecutor
from langchain_cohere.react_multi_hop.agent import create_cohere_react_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_cohere import ChatCohere
from langchain_community.tools.tavily_search import TavilySearchResults
from pydantic import BaseModel, Field
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load environment variables
cohere_api_key = os.getenv("COHERE_API_KEY")
if not cohere_api_key:
    logger.error("COHERE_API_KEY environment variable not set.")
    raise ValueError("COHERE_API_KEY environment variable not set.")

# Initialize the internet search tool
internet_search = TavilySearchResults(include_answer=True)
internet_search.name = "internet_search"
internet_search.description = "Returns a list of relevant document snippets for a textual query retrieved from the internet, including fact-checking information."

class TavilySearchInput(BaseModel):
    query: str = Field(description="Query to search the internet with")
    # include_factuality: bool = Field(default=True, description="Indicates if factuality information is required")

internet_search.args_schema = TavilySearchInput

# Define the Cohere LLM
llm = ChatCohere(cohere_api_key=cohere_api_key, model="command-r-plus-08-2024", temperature=0)

# Preamble
preamble = """
You are an expert who fact-checks the user's information with the most relevant datasource. You are equipped with an internet search tool and a special vectorstore of information about the internet.
"""

# Prompt template
prompt = ChatPromptTemplate.from_template(
    "You are an expert who fact-checks the user's information. "
    "User query: {input}. "
    "Please provide a detailed response with sources."
)

# Create the ReAct agent
agent = create_cohere_react_agent(llm=llm, tools=[internet_search], prompt=prompt)
agent_executor = AgentExecutor(agent=agent, tools=[internet_search], verbose=True)
class FactualityResponse(BaseModel):
    is_factual: bool
    confidence: float
    reasoning: str

from flask import Flask, request, jsonify
from langchain_cohere import ChatCohere
from typing import Literal
from pydantic import BaseModel

class FactualityResponse(BaseModel):
    is_factual: bool
    confidence: float
    reasoning: str

def analyze_factuality(text: str, llm: ChatCohere) -> FactualityResponse:
    """
    Analyzes if a given text is saying that a certain statement is false or true.
    Returns a structured response indicating whether the text claims something is true or false.
    """
    prompt = f"""
You are an expert at analyzing statements. Your task is to determine if the following text is stating that something is true or false.
DO NOT try to verify if the information itself is true - only analyze if the text is SAYING it's true or false.

For example:
"Based on the sources, this statement is correct" -> is_factual: true
"This claim is incorrect according to the evidence" -> is_factual: false
"The sources contradict this statement" -> is_factual: false
"The information provided is accurate" -> is_factual: true

Respond in valid JSON format with these fields:
- is_factual: boolean (true if the text is saying something is true/correct, false if the text is saying something is false/incorrect)
- confidence: float between 0 and 1 (how clear is the text in making this true/false statement)
- reasoning: brief explanation of what words/phrases in the text indicate it's saying true or false

Text to analyze:
{text}

JSON Response:"""

    response = llm.invoke(prompt)
    
    try:
        # Parse the JSON response from Cohere
        import json
        analysis = json.loads(response.content)
        return FactualityResponse(**analysis)
    except Exception as e:
        logger.error(f"Error parsing Cohere response: {e}")
        logger.error(f"Raw response: {response.content}")
        return FactualityResponse(
            is_factual=False,
            confidence=0.0,
            reasoning=f"Error analyzing response: {str(e)}"
        )

def summarize_query(text: str, llm: ChatCohere) -> str:
    """
    Takes a query and returns a concise, fact-checkable summary.
    Removes fluff and focuses on the core claims.
    """
    prompt = f"""
You are an expert at condensing text into clear, fact-checkable statements.
Create a single, concise summary that:
1. Captures the main factual claims
2. Removes unnecessary details and opinions
3. Maintains the core meaning
4. Uses neutral language
5. Focuses only on verifiable information

For example:
Input: "The iPhone was created by Steve Jobs at Apple in 2007, and it was absolutely revolutionary, completely changing how we think about phones forever. It was a game-changer that made Apple tons of money and showed how innovative they are!"
Output: Apple, under Steve Jobs, launched the iPhone in 2007, which became a successful smartphone product.

Now create a similar summary for this text:
{text}

Respond with ONLY the summary, no additional text or explanation."""

    try:
        response = llm.invoke(prompt)
        summary = response.content.strip()
        logger.info(f"Summarized query: {summary}")
        return summary
    except Exception as e:
        logger.error(f"Error summarizing query: {e}")
        return text  # Return original text if summarization fails

@app.route('/invoke', methods=['POST'])
def invoke_agent():
    try:
        # Get the JSON data from the request
        data = request.json

        # Validate input data
        input_data = TavilySearchInput(**data)
        
        # Create a summary of the query
        summarized_query = summarize_query(input_data.query, llm)

        # Prepare the input for the agent using the summarized query
        agent_input = {
            "input": summarized_query,  # Use the summarized version for fact-checking
            "preamble": preamble,
        }

        # Invoke the agent
        agent_response = agent_executor.invoke(agent_input)
        logger.info(f"Agent response: {agent_response['output']}")

        # Get Tavily search results using the summarized query
        tavily_response = internet_search.invoke(
            {"query": summarized_query}
        )

        # Analyze if the response is saying true or false
        try:
            factuality_analysis = analyze_factuality(
                agent_response["output"],
                llm
            )

            factuality_result = {
                "is_factual": factuality_analysis.is_factual,
                "confidence": factuality_analysis.confidence,
                "reasoning": factuality_analysis.reasoning
            }
        except Exception as e:
            logger.error(f"Error in factuality analysis: {e}")
            factuality_result = {
                "is_factual": False,
                "confidence": 0.0,
                "reasoning": f"Error in analysis: {str(e)}"
            }

        # Process the response
        formatted_response = {
            "original_query": input_data.query,
            "summarized_query": summarized_query,
            "agent_response": agent_response["output"],
            "factuality_analysis": factuality_result,
            "search_results": {
                "sources": [
                    {
                        "url": result.get("url", "No URL"),
                        "content": result.get("content", "No content")
                    }
                    for result in tavily_response
                ] if isinstance(tavily_response, list) else []
            }
        }

        return jsonify(formatted_response), 200

    except Exception as e:
        logger.error(f"Error invoking agent: {str(e)}")
        return jsonify({"error": str(e)}), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001)  # Run the Flask app