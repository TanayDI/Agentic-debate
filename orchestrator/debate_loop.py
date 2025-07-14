"""
Main debate orchestration logic
"""

import asyncio
import time
from typing import Dict, Any, List, Optional

from agents.pro_agent import ProAgent
from agents.con_agent import ConAgent
from agents.judge_agent import JudgeAgent
from agents.base_agent import Message
from orchestrator.turn_manager import TurnManager
from orchestrator.memory_manager import MemoryManager
from config.settings import Config
from utils.logger import setup_logger

logger = setup_logger(__name__)

class DebateOrchestrator:
    """Orchestrates the entire debate process"""
    
    def __init__(self, config: Config):
        self.config = config
        self.turn_manager = TurnManager(config.debate)
        self.memory_manager = MemoryManager()
        
        # Initialize agents
        self.pro_agent = ProAgent(config.agents.pro, config.api_keys)
        self.con_agent = ConAgent(config.agents.con, config.api_keys)
        self.judge_agent = JudgeAgent(config.agents.judge, config.api_keys, config.tools)
        
        logger.info("Debate orchestrator initialized")
    
    async def run_debate(self, topic: str) -> Dict[str, Any]:
        """Run a complete debate session"""
        logger.info(f"Starting debate on topic: {topic}")
        
        start_time = time.time()
        
        try:
            # Phase 1: Research
            research_context = await self._research_phase(topic)
            
            # Phase 2: Debate
            conversation_history = await self._debate_phase(topic, research_context)
            
            # Phase 3: Judgment
            judgment = await self._judgment_phase(topic, conversation_history)
            
            end_time = time.time()
            duration = end_time - start_time
            
            # Compile results
            result = {
                "topic": topic,
                "winner": judgment["winner"],
                "reasoning": judgment["reasoning"],
                "score": judgment["score"],
                "transcript": [
                    {
                        "role": msg.role,
                        "content": msg.content,
                        "timestamp": msg.timestamp,
                        "metadata": msg.metadata
                    }
                    for msg in conversation_history
                ],
                "metadata": {
                    "duration": duration,
                    "total_turns": len([msg for msg in conversation_history if msg.role in ['pro', 'con']]),
                    "research_context": research_context[:500] + "..." if len(research_context) > 500 else research_context,
                    "analysis": judgment.get("analysis", {})
                }
            }
            
            logger.info(f"Debate completed. Winner: {judgment['winner']}")
            return result
            
        except Exception as e:
            logger.error(f"Debate failed: {str(e)}")
            raise
    
    async def _research_phase(self, topic: str) -> str:
        """Phase 1: Judge researches the topic"""
        logger.info("Starting research phase")
        
        try:
            research_context = await self.judge_agent.research_topic(topic)
            
            # Add research to memory
            research_msg = Message(
                role="system",
                content=f"Research completed for topic: {topic}",
                timestamp=time.time(),
                metadata={"phase": "research", "research_context": research_context}
            )
            self.memory_manager.add_message(research_msg)
            
            logger.info("Research phase completed")
            return research_context
            
        except Exception as e:
            logger.error(f"Research phase failed: {str(e)}")
            return f"Research failed: {str(e)}"
    
    async def _debate_phase(self, topic: str, research_context: str) -> List[Message]:
        """Phase 2: PRO and CON agents debate"""
        logger.info("Starting debate phase")
        
        conversation_history = []
        context = {"research": research_context}
        
        # PRO agent starts
        current_agent = "pro"
        
        while not self.turn_manager.is_debate_finished():
            try:
                # Check timeout
                if self.turn_manager.is_turn_timeout():
                    logger.warning("Turn timeout reached")
                    break
                
                # Generate response
                if current_agent == "pro":
                    response = await self.pro_agent.generate_response(
                        topic, conversation_history, context
                    )
                    agent = self.pro_agent
                else:
                    response = await self.con_agent.generate_response(
                        topic, conversation_history, context
                    )
                    agent = self.con_agent
                
                # Create message
                message = Message(
                    role=current_agent,
                    content=response,
                    timestamp=time.time(),
                    metadata={
                        "turn": self.turn_manager.current_turn,
                        "agent_config": {
                            "model": agent.config.model,
                            "provider": agent.config.provider
                        }
                    }
                )
                
                # Add to history and memory
                conversation_history.append(message)
                self.memory_manager.add_message(message)
                
                # Log the turn
                logger.info(f"Turn {self.turn_manager.current_turn} ({current_agent.upper()}): {len(response)} characters")
                
                # Advance turn
                self.turn_manager.advance_turn()
                
                # Switch agents
                current_agent = "con" if current_agent == "pro" else "pro"
                
                # Small delay to prevent rate limiting
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in debate turn: {str(e)}")
                break
        
        logger.info(f"Debate phase completed. Total turns: {len(conversation_history)}")
        return conversation_history
    
    async def _judgment_phase(self, topic: str, conversation_history: List[Message]) -> Dict[str, Any]:
        """Phase 3: Judge evaluates the debate"""
        logger.info("Starting judgment phase")
        
        try:
            judgment = await self.judge_agent.judge_debate(topic, conversation_history)
            
            # Add judgment to memory
            judgment_msg = Message(
                role="judge",
                content=f"Judgment: {judgment['winner']} wins",
                timestamp=time.time(),
                metadata={"phase": "judgment", "judgment": judgment}
            )
            self.memory_manager.add_message(judgment_msg)
            
            logger.info("Judgment phase completed")
            return judgment
            
        except Exception as e:
            logger.error(f"Judgment phase failed: {str(e)}")
            return {
                "winner": "ERROR",
                "reasoning": f"Judgment failed: {str(e)}",
                "score": {"pro_score": 0, "con_score": 0},
                "analysis": {}
            }
