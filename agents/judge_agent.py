from .base_agent import BaseAgent
from dataclasses import dataclass
from typing import Any, Dict

class JudgeAgent(BaseAgent):
    def __init__(self, broker, agent_id):
        super().__init__(broker, agent_id)
        self.results = {}

    def receive_message(self, message):
        """Handle incoming messages from other agents."""
        if message.message_type == "response":
            # Ensure content is treated properly
            content = message.content  # Access the content attribute
            if "for" in content:
                self.results["for"] = content["for"]
            elif "against" in content:
                self.results["against"] = content["against"]

            # Combine results if both are available
            if "for" in self.results and "against" in self.results:
                combined_sources = (
                    self.results["for"]["sources"] +
                    self.results["against"]["sources"]
                )
                summary = self.generate_summary(
                    for_sources=self.results["for"]["sources"],
                    against_sources=self.results["against"]["sources"]
                )
                final_message = self.create_message(
                    receiver="app",
                    content={
                        "summary": summary,
                        "sources": combined_sources
                    }
                )
                self.broker.send_message(final_message)
        else:
            self.logger.error("Unhandled message type.")

    def generate_summary(self, for_sources, against_sources):
        """Generate a summary based on sources."""
        return f"FOR: {len(for_sources)} sources, AGAINST: {len(against_sources)} sources."
