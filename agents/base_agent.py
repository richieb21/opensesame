from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict

@dataclass
class Message:
    sender: str
    receiver: str
    message_type: str
    content: Any
    metadata: Dict = None
    timestamp: str = None
    message_id: str = None

    def __post_init__(self):
        self.timestamp = self.timestamp or datetime.now().isoformat()
        self.message_id = self.message_id or f"{self.sender}-{self.timestamp}"

    def to_dict(self) -> Dict:
        return {
            "message_id": self.message_id,
            "sender": self.sender,
            "receiver": self.receiver,
            "message_type": self.message_type,
            "content": self.content,
            "metadata": self.metadata,
            "timestamp": self.timestamp
        }

class BaseAgent:
    def __init__(self, broker, agent_id):
        self.broker = broker
        self.agent_id = agent_id
        broker.subscribe(agent_id, self.receive_message)

    def create_message(self, receiver: str, content: Any) -> Message:
        return Message(
            sender=self.agent_id,
            receiver=receiver,
            message_type="response",
            content=content
        )

    def receive_message(self, message: Message):
        raise NotImplementedError("This method must be implemented by subclasses.")
