from datetime import datetime
from models.message import Message
import logging

class MessageBroker:
    def __init__(self):
        self.message_log = []
        self.subscribers = {}
        self.logger = logging.getLogger(__name__)

    def subscribe(self, agent_id, callback):
        """Subscribe an agent to receive messages."""
        self.subscribers[agent_id] = callback

    def send_message(self, message):
        """Send a message to a specific receiver."""
        self.message_log.append(message)
        if message.receiver in self.subscribers:
            return self.subscribers[message.receiver](message)
        else:
            self.logger.warning(f"No subscriber found for {message.receiver}")
            return None
