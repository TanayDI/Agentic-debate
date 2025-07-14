"""
Configuration management for Debate Mirror MCP
"""

import os
import yaml
from pathlib import Path
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from dataclasses import dataclass

class AgentConfig(BaseModel):
    model: str = "gemini-2.0-flash-exp"
    provider: str = "google"
    temperature: float = 0.7
    max_tokens: int = 1000

class DebateConfig(BaseModel):
    max_turns: int = 10
    max_time: int = 1800  # 30 minutes
    turn_timeout: int = 120  # 2 minutes per turn

class AgentsConfig(BaseModel):
    pro: AgentConfig = AgentConfig()
    con: AgentConfig = AgentConfig()
    judge: AgentConfig = AgentConfig()

class ToolsConfig(BaseModel):
    web_search: Dict[str, Any] = {
        "provider": "duckduckgo",
        "max_results": 5,
        "timeout": 30
    }

class Config(BaseModel):
    debate: DebateConfig = DebateConfig()
    agents: AgentsConfig = AgentsConfig()
    tools: ToolsConfig = ToolsConfig()
    api_keys: Dict[str, str] = {}

def load_config(config_path: Optional[str] = None) -> Config:
    """Load configuration from file or environment"""
    
    # Default config path
    if not config_path:
        config_path = Path(__file__).parent / "config.yaml"
    
    config_data = {}
    
    # Load from YAML file if exists
    if Path(config_path).exists():
        with open(config_path, 'r') as f:
            config_data = yaml.safe_load(f) or {}
    
    # Override with environment variables
    api_keys = {}
    for key in ["OPENAI_API_KEY", "GOOGLE_API_KEY", "ANTHROPIC_API_KEY", 
                "XAI_API_KEY", "GROQ_API_KEY", "TAVILY_API_KEY", "SERPAPI_KEY"]:
        if os.getenv(key):
            api_keys[key.lower()] = os.getenv(key)
    
    if api_keys:
        config_data["api_keys"] = {**config_data.get("api_keys", {}), **api_keys}
    
    return Config(**config_data)

def save_config(config: Config, config_path: str):
    """Save configuration to file"""
    with open(config_path, 'w') as f:
        yaml.dump(config.dict(), f, default_flow_style=False)
