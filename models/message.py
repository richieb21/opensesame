from datetime import datetime
from typing import Any, Dict

class Message:
    def __init__(self, sender, receiver, message_type, content, metadata=None):
        self.sender = sender
        self.receiver = receiver
        self.message_type = message_type
        self.content = content
        self.metadata = metadata or {}
        self.timestamp = datetime.now().isoformat()

    def to_dict(self):
        return {
            "sender": self.sender,
            "receiver": self.receiver,
            "message_type": self.message_type,
            "content": self.content,
            "metadata": self.metadata,
            "timestamp": self.timestamp
        }
