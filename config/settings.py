"""
Configuration management for AgenticDebate
"""

import os
import yaml
from pathlib import Path
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from dataclasses import dataclass
from dotenv import load_dotenv

class AgentConfig(BaseModel):
    model: str = "gemini-1.5-flash"
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
    tools: Dict[str, Any] = ToolsConfig().model_dump()
    api_keys: Dict[str, str] = {}

    @classmethod
    def __get_validators__(cls):
        yield from super().__get_validators__()
        yield cls.ensure_tools_dict

    @classmethod
    def ensure_tools_dict(cls, values):
        # This will be called by Pydantic during model creation
        tools = values.get('tools')
        if isinstance(tools, ToolsConfig):
            values['tools'] = tools.model_dump()
        elif not isinstance(tools, dict):
            try:
                values['tools'] = dict(tools)
            except Exception:
                values['tools'] = ToolsConfig().model_dump()
        return values

def load_config(config_path: Optional[str] = None) -> Config:
    """Load configuration from file or environment"""
    # Load environment variables from .env file
    load_dotenv()
    
    # Default config path
    if not config_path:
        config_path = Path(__file__).parent / "config.yaml"

    config_data = {}

    # Load from YAML file if exists
    if Path(config_path).exists():
        with open(config_path, 'r') as f:
            config_data = yaml.safe_load(f) or {}

    # Ensure tools is always a dict, even if loaded as a nested pydantic model or other object
    if "tools" in config_data:
        try:
            # Try .model_dump() if available (pydantic v2)
            config_data["tools"] = config_data["tools"].model_dump()
        except Exception:
            try:
                # Try to cast to dict (if already a dict, this is a no-op)
                config_data["tools"] = dict(config_data["tools"])
            except Exception:
                config_data["tools"] = ToolsConfig().model_dump()
    else:
        config_data["tools"] = ToolsConfig().model_dump()

    # Override with environment variables
    api_keys = {}
    for key in ["OPENAI_API_KEY", "GOOGLE_API_KEY", "ANTHROPIC_API_KEY", 
                "XAI_API_KEY", "GROQ_API_KEY", "TAVILY_API_KEY", "SERPAPI_KEY"]:
        env_value = os.getenv(key)
        if env_value:
            api_keys[key.lower()] = env_value

    if api_keys:
        config_data["api_keys"] = {**config_data.get("api_keys", {}), **api_keys}
    
    return Config(**config_data)

def save_config(config: Config, config_path: str):
    """Save configuration to file"""
    with open(config_path, 'w') as f:
        yaml.dump(config.dict(), f, default_flow_style=False)
