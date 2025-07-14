"""
JUDGE agent - researches topics and evaluates debates
"""

from typing import Dict, Any, List, Optional
from pathlib import Path
import json

from .base_agent import BaseAgent, Message
from tools.web_search_tool import WebSearchTool
from utils.logger import setup_logger

logger = setup_logger(__name__)

class JudgeAgent(BaseAgent):
    """Agent that researches topics and judges debates"""
    
    def __init__(self, config, api_keys: Dict[str, str], tools_config: Dict[str, Any]):
        super().__init__(config, "judge", api_keys)
        self.web_search = WebSearchTool(tools_config.get('web_search', {}), api_keys)
    
    async def research_topic(self, topic: str) -> str:
        """Research the debate topic using web search"""
        self.logger.info(f"Researching topic: {topic}")
        
        try:
            # Perform web search
            search_results = await self.web_search.search(topic)
            
            # Format research context
            research_parts = [
                f"RESEARCH RESULTS FOR: {topic}",
                "=" * 50,
                ""
            ]
            
            for i, result in enumerate(search_results, 1):
                research_parts.extend([
                    f"{i}. {result.get('title', 'No title')}",
                    f"   Source: {result.get('url', 'No URL')}",
                    f"   Summary: {result.get('snippet', 'No summary')}",
                    ""
                ])
            
            research_context = "\n".join(research_parts)
            
            # Generate research summary using LLM
            system_prompt = """You are a research assistant. Analyze the provided search results and create a balanced, informative summary that will help debaters understand the key aspects of the topic.

Focus on:
- Key facts and statistics
- Main arguments on both sides
- Important context and background
- Credible sources and evidence

Be objective and comprehensive."""

            summary_prompt = f"""Based on these search results, provide a comprehensive research summary for the debate topic: "{topic}"

{research_context}

Create a balanced summary that covers:
1. Background and context
2. Key arguments FOR the topic
3. Key arguments AGAINST the topic
4. Important facts and statistics
5. Notable sources and references

Research Summary:"""

            summary = await self._call_llm(summary_prompt, system_prompt)
            
            return f"{research_context}\n\nRESEARCH SUMMARY:\n{summary}"
            
        except Exception as e:
            self.logger.error(f"Research failed: {str(e)}")
            return f"Research could not be completed for topic: {topic}. Error: {str(e)}"
    
    async def judge_debate(self, 
                          topic: str, 
                          conversation_history: List[Message]) -> Dict[str, Any]:
        """Judge the debate and declare a winner"""
        
        system_prompt = self._get_system_prompt()
        
        # Build debate transcript
        transcript_parts = [f"DEBATE TOPIC: {topic}", "=" * 50, ""]
        
        for msg in conversation_history:
            if msg.role in ['pro', 'con']:
                role_name = msg.role.upper()
                transcript_parts.extend([
                    f"{role_name} ARGUMENT:",
                    msg.content,
                    ""
                ])
        
        transcript = "\n".join(transcript_parts)
        
        # Judge the debate
        judge_prompt = f"""Analyze this complete debate transcript and provide your judgment:

{transcript}

Evaluate based on:
1. Strength of arguments and evidence
2. Logical reasoning and coherence
3. Addressing of counterarguments
4. Use of credible sources and facts
5. Overall persuasiveness

Provide your judgment in the following JSON format:
{{
    "winner": "PRO" or "CON",
    "reasoning": "Detailed explanation of your decision",
    "score": {{
        "pro_score": 0-100,
        "con_score": 0-100
    }},
    "analysis": {{
        "pro_strengths": ["strength1", "strength2"],
        "pro_weaknesses": ["weakness1", "weakness2"],
        "con_strengths": ["strength1", "strength2"],
        "con_weaknesses": ["weakness1", "weakness2"]
    }}
}}

Your judgment:"""

        self.logger.info(f"Judging debate on topic: {topic}")
        response = await self._call_llm(judge_prompt, system_prompt)
        
        try:
            # Parse JSON response
            judgment = json.loads(response.strip())
            return judgment
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            self.logger.warning("Failed to parse judge response as JSON")
            return {
                "winner": "TIE",
                "reasoning": "Unable to determine winner due to parsing error",
                "score": {"pro_score": 50, "con_score": 50},
                "analysis": {
                    "pro_strengths": [],
                    "pro_weaknesses": [],
                    "con_strengths": [],
                    "con_weaknesses": []
                }
            }
    
    async def generate_response(self, 
                              topic: str, 
                              conversation_history: List[Message],
                              context: Optional[Dict[str, Any]] = None) -> str:
        """Generate judge response (used for research phase)"""
        return await self.research_topic(topic)
    
    def _load_prompt_template(self) -> str:
        """Load the JUDGE agent prompt template"""
        template_path = Path(__file__).parent.parent / "prompts" / "judge_agent.txt"
        
        if template_path.exists():
            with open(template_path, 'r') as f:
                return f.read()
        
        # Fallback system prompt
        return """You are an impartial debate judge with expertise in critical thinking and argumentation.

Your responsibilities:
1. Research topics thoroughly using available tools
2. Evaluate debates based on objective criteria
3. Provide fair and balanced judgments
4. Explain your reasoning clearly

Evaluation criteria:
- Strength and quality of arguments
- Use of evidence and credible sources
- Logical reasoning and coherence
- Addressing of counterarguments
- Overall persuasiveness and impact

Guidelines:
- Remain completely impartial and objective
- Base judgments on argument quality, not personal beliefs
- Provide detailed reasoning for all decisions
- Consider both sides fairly
- Focus on facts, logic, and evidence"""
