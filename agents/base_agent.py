"""
Base agent class for the debate system
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import time

from config.settings import AgentConfig
from utils.llm_client import LLMClient
from utils.logger import setup_logger

logger = setup_logger(__name__)

@dataclass
class Message:
    role: str  # 'pro', 'con', 'judge', 'system'
    content: str
    timestamp: float
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

class BaseAgent(ABC):
    """Base class for all debate agents"""
    
    def __init__(self, config: AgentConfig, role: str, api_keys: Dict[str, str]):
        self.config = config
        self.role = role
        self.llm_client = LLMClient(config, api_keys)
        self.logger = setup_logger(f"agent.{role}")
    
    @abstractmethod
    async def generate_response(self, 
                              topic: str, 
                              conversation_history: List[Message],
                              context: Optional[Dict[str, Any]] = None) -> str:
        """Generate a response based on the conversation history"""
        pass
    
    def _build_conversation_context(self, 
                                  conversation_history: List[Message],
                                  max_history: int = 10) -> str:
        """Build conversation context from history"""
        if not conversation_history:
            return ""
        
        # Take the most recent messages
        recent_history = conversation_history[-max_history:]
        
        context_parts = []
        for msg in recent_history:
            if msg.role == 'system':
                continue
            role_name = msg.role.upper()
            context_parts.append(f"{role_name}: {msg.content}")
        
        return "\n\n".join(context_parts)
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for this agent"""
        return self._load_prompt_template()
    
    @abstractmethod
    def _load_prompt_template(self) -> str:
        """Load the prompt template for this agent"""
        pass
    
    async def _call_llm(self, prompt: str, system_prompt: str) -> str:
        """Call the LLM with the given prompt"""
        try:
            response = await self.llm_client.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens
            )
            return response
        except Exception as e:
            self.logger.error(f"LLM call failed: {str(e)}")
            raise
