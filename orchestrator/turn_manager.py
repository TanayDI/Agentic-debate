"""
Turn management for the debate system
"""

import time
from typing import Optional
from dataclasses import dataclass

from config.settings import DebateConfig
from utils.logger import setup_logger

logger = setup_logger(__name__)

@dataclass
class TurnState:
    current_turn: int = 0
    start_time: float = 0
    last_turn_time: float = 0
    max_turns: int = 10
    max_time: int = 1800
    turn_timeout: int = 120

class TurnManager:
    """Manages turns and timing for the debate"""
    
    def __init__(self, config: DebateConfig):
        self.config = config
        self.state = TurnState(
            max_turns=config.max_turns,
            max_time=config.max_time,
            turn_timeout=config.turn_timeout,
            start_time=time.time()
        )
        logger.info(f"Turn manager initialized: max_turns={config.max_turns}, max_time={config.max_time}s")
    
    @property
    def current_turn(self) -> int:
        """Get the current turn number"""
        return self.state.current_turn
    
    def advance_turn(self):
        """Advance to the next turn"""
        self.state.current_turn += 1
        self.state.last_turn_time = time.time()
        logger.debug(f"Advanced to turn {self.state.current_turn}")
    
    def is_debate_finished(self) -> bool:
        """Check if the debate should end"""
        current_time = time.time()
        
        # Check turn limit
        if self.state.current_turn >= self.state.max_turns:
            logger.info(f"Debate finished: reached max turns ({self.state.max_turns})")
            return True
        
        # Check time limit
        if current_time - self.state.start_time >= self.state.max_time:
            logger.info(f"Debate finished: reached max time ({self.state.max_time}s)")
            return True
        
        return False
    
    def is_turn_timeout(self) -> bool:
        """Check if the current turn has timed out"""
        if self.state.last_turn_time == 0:
            return False
        
        current_time = time.time()
        if current_time - self.state.last_turn_time >= self.state.turn_timeout:
            logger.warning(f"Turn timeout: {self.state.turn_timeout}s exceeded")
            return True
        
        return False
    
    def get_remaining_time(self) -> float:
        """Get remaining time for the debate"""
        current_time = time.time()
        elapsed = current_time - self.state.start_time
        return max(0, self.state.max_time - elapsed)
    
    def get_remaining_turns(self) -> int:
        """Get remaining turns for the debate"""
        return max(0, self.state.max_turns - self.state.current_turn)
    
    def get_stats(self) -> dict:
        """Get current turn statistics"""
        current_time = time.time()
        return {
            "current_turn": self.state.current_turn,
            "remaining_turns": self.get_remaining_turns(),
            "elapsed_time": current_time - self.state.start_time,
            "remaining_time": self.get_remaining_time(),
            "turn_timeout": self.state.turn_timeout
        }
