"""
Memory management for the debate system
"""

from typing import List, Dict, Any, Optional
import json
from collections import deque

from agents.base_agent import Message
from utils.logger import setup_logger

logger = setup_logger(__name__)

class MemoryManager:
    """Manages conversation memory and context"""
    
    def __init__(self, max_memory_size: int = 1000):
        self.max_memory_size = max_memory_size
        self.messages: deque = deque(maxlen=max_memory_size)
        self.metadata: Dict[str, Any] = {}
        logger.info(f"Memory manager initialized with max size: {max_memory_size}")
    
    def add_message(self, message: Message):
        """Add a message to memory"""
        self.messages.append(message)
        logger.debug(f"Added message to memory: {message.role} ({len(message.content)} chars)")
    
    def get_messages(self, 
                    role_filter: Optional[List[str]] = None,
                    limit: Optional[int] = None) -> List[Message]:
        """Get messages from memory with optional filtering"""
        messages = list(self.messages)
        
        # Filter by role if specified
        if role_filter:
            messages = [msg for msg in messages if msg.role in role_filter]
        
        # Limit results if specified
        if limit:
            messages = messages[-limit:]
        
        return messages
    
    def get_conversation_history(self, limit: Optional[int] = None) -> List[Message]:
        """Get conversation history (excluding system messages)"""
        return self.get_messages(
            role_filter=['pro', 'con', 'judge'],
            limit=limit
        )
    
    def get_debate_messages(self, limit: Optional[int] = None) -> List[Message]:
        """Get only debate messages (PRO and CON)"""
        return self.get_messages(
            role_filter=['pro', 'con'],
            limit=limit
        )
    
    def clear_memory(self):
        """Clear all memory"""
        self.messages.clear()
        self.metadata.clear()
        logger.info("Memory cleared")
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory statistics"""
        role_counts = {}
        total_chars = 0
        
        for msg in self.messages:
            role_counts[msg.role] = role_counts.get(msg.role, 0) + 1
            total_chars += len(msg.content)
        
        return {
            "total_messages": len(self.messages),
            "role_counts": role_counts,
            "total_characters": total_chars,
            "memory_usage": f"{len(self.messages)}/{self.max_memory_size}"
        }
    
    def export_memory(self) -> Dict[str, Any]:
        """Export memory to a serializable format"""
        return {
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp,
                    "metadata": msg.metadata
                }
                for msg in self.messages
            ],
            "metadata": self.metadata,
            "stats": self.get_memory_stats()
        }
    
    def import_memory(self, data: Dict[str, Any]):
        """Import memory from serialized data"""
        self.clear_memory()
        
        for msg_data in data.get("messages", []):
            message = Message(
                role=msg_data["role"],
                content=msg_data["content"],
                timestamp=msg_data["timestamp"],
                metadata=msg_data.get("metadata", {})
            )
            self.add_message(message)
        
        self.metadata = data.get("metadata", {})
        logger.info(f"Imported {len(self.messages)} messages from memory data")
