from .base_agent import BaseAgent
from services.search import perform_search

class AgainstAgent(BaseAgent):
    def __init__(self, broker):
        super().__init__(broker, "against_agent")
        self.prompt = """
You are an expert at finding information that challenges or opposes a statement. Your task is to retrieve sources and evidence that provide strong counterarguments or data against the given claim.
Statement: "{query}"
Respond with the most relevant opposing sources.
"""

    def receive_message(self, message):
        query = message["content"]
        # Modify query using the prompt
        formatted_query = self.prompt.format(query=query)
        results = perform_search(formatted_query)  # Fetch opposing sources
        return self.create_message("judge_agent", results)
