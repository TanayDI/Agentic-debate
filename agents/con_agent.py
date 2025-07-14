"""
CON agent - argues against the debate topic
"""

from typing import Dict, Any, List, Optional
from pathlib import Path

from .base_agent import BaseAgent, Message
from utils.logger import setup_logger

logger = setup_logger(__name__)

class ConAgent(BaseAgent):
    """Agent that argues against the debate topic"""
    
    def __init__(self, config, api_keys: Dict[str, str]):
        super().__init__(config, "con", api_keys)
    
    async def generate_response(self, 
                              topic: str, 
                              conversation_history: List[Message],
                              context: Optional[Dict[str, Any]] = None) -> str:
        """Generate a CON argument"""
        
        system_prompt = self._get_system_prompt()
        conversation_context = self._build_conversation_context(conversation_history)
        
        # Build the prompt
        prompt_parts = [
            f"DEBATE TOPIC: {topic}",
            "",
            "RESEARCH CONTEXT:" if context and context.get('research') else "",
            context.get('research', '') if context else "",
            "",
            "CONVERSATION HISTORY:" if conversation_context else "",
            conversation_context,
            "",
            "Your task: Provide a strong CON argument against this topic. Be persuasive, use evidence, and directly address any PRO arguments that have been made.",
            "",
            "Guidelines:",
            "- Stay focused on the topic",
            "- Use logical reasoning and evidence",
            "- Address pro-arguments directly",
            "- Be respectful but assertive",
            "- Keep your response concise but comprehensive",
            "",
            "Your CON argument:"
        ]
        
        prompt = "\n".join(filter(None, prompt_parts))
        
        self.logger.info(f"Generating CON response for topic: {topic}")
        response = await self._call_llm(prompt, system_prompt)
        
        return response.strip()
    
    def _load_prompt_template(self) -> str:
        """Load the CON agent prompt template"""
        template_path = Path(__file__).parent.parent / "prompts" / "con_agent.txt"
        
        if template_path.exists():
            with open(template_path, 'r') as f:
                return f.read()
        
        # Fallback system prompt
        return """You are a skilled debater arguing AGAINST the given topic.

Your role:
- Present strong, evidence-based arguments opposing the CON position
- Use logical reasoning, facts, and credible sources
- Address pro-arguments effectively
- Maintain a professional and persuasive tone
- Stay focused on the debate topic

Debate guidelines:
- Be respectful but assertive in your arguments
- Use specific examples and evidence when possible
- Structure your arguments clearly
- Acknowledge valid points from the opposition while reinforcing your position
- Avoid personal attacks or inflammatory language

Remember: You are arguing AGAINST the topic. Make the strongest possible case against the position."""
