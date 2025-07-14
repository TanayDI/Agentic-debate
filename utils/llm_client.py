"""
LLM client for interacting with different AI providers
"""

import asyncio
from typing import Dict, Any, Optional
import aiohttp
import json

from config.settings import AgentConfig
from utils.logger import setup_logger

logger = setup_logger(__name__)

class LLMClient:
    """Client for interacting with various LLM providers"""
    
    def __init__(self, config: AgentConfig, api_keys: Dict[str, str]):
        self.config = config
        self.api_keys = api_keys
        self.provider = config.provider.lower()
        
        # Validate API key
        self._validate_api_key()
        
        logger.info(f"LLM client initialized: {self.provider}/{self.config.model}")
    
    def _validate_api_key(self):
        """Validate that the required API key is available"""
        key_mapping = {
            "google": "google_api_key",
            "openai": "openai_api_key",
            "anthropic": "anthropic_api_key",
            "xai": "xai_api_key",
            "groq": "groq_api_key"
        }
        
        required_key = key_mapping.get(self.provider)
        if required_key and not self.api_keys.get(required_key):
            raise ValueError(f"API key '{required_key}' is required for provider '{self.provider}'")
    
    async def generate(self, 
                      prompt: str, 
                      system_prompt: Optional[str] = None,
                      temperature: Optional[float] = None,
                      max_tokens: Optional[int] = None) -> str:
        """Generate text using the configured LLM provider"""
        
        temperature = temperature or self.config.temperature
        max_tokens = max_tokens or self.config.max_tokens
        
        try:
            if self.provider == "google":
                return await self._generate_google(prompt, system_prompt, temperature, max_tokens)
            elif self.provider == "openai":
                return await self._generate_openai(prompt, system_prompt, temperature, max_tokens)
            elif self.provider == "anthropic":
                return await self._generate_anthropic(prompt, system_prompt, temperature, max_tokens)
            elif self.provider == "xai":
                return await self._generate_xai(prompt, system_prompt, temperature, max_tokens)
            elif self.provider == "groq":
                return await self._generate_groq(prompt, system_prompt, temperature, max_tokens)
            else:
                raise ValueError(f"Unsupported provider: {self.provider}")
                
        except Exception as e:
            logger.error(f"LLM generation failed: {str(e)}")
            raise
    
    async def _generate_google(self, prompt: str, system_prompt: str, temperature: float, max_tokens: int) -> str:
        """Generate using Google Gemini API"""
        api_key = self.api_keys["google_api_key"]
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.config.model}:generateContent?key={api_key}"
        
        # Combine system and user prompts
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        payload = {
            "contents": [{
                "parts": [{"text": full_prompt}]
            }],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "topP": 0.8,
                "topK": 10
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                else:
                    error_text = await response.text()
                    raise Exception(f"Google API error {response.status}: {error_text}")
    
    async def _generate_openai(self, prompt: str, system_prompt: str, temperature: float, max_tokens: int) -> str:
        """Generate using OpenAI API"""
        api_key = self.api_keys["openai_api_key"]
        url = "https://api.openai.com/v1/chat/completions"
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.config.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    error_text = await response.text()
                    raise Exception(f"OpenAI API error {response.status}: {error_text}")
    
    async def _generate_anthropic(self, prompt: str, system_prompt: str, temperature: float, max_tokens: int) -> str:
        """Generate using Anthropic Claude API"""
        api_key = self.api_keys["anthropic_api_key"]
        url = "https://api.anthropic.com/v1/messages"
        
        payload = {
            "model": self.config.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["content"][0]["text"]
                else:
                    error_text = await response.text()
                    raise Exception(f"Anthropic API error {response.status}: {error_text}")
    
    async def _generate_xai(self, prompt: str, system_prompt: str, temperature: float, max_tokens: int) -> str:
        """Generate using xAI Grok API"""
        api_key = self.api_keys["xai_api_key"]
        url = "https://api.x.ai/v1/chat/completions"
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.config.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    error_text = await response.text()
                    raise Exception(f"xAI API error {response.status}: {error_text}")
    
    async def _generate_groq(self, prompt: str, system_prompt: str, temperature: float, max_tokens: int) -> str:
        """Generate using Groq API"""
        api_key = self.api_keys["groq_api_key"]
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.config.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    error_text = await response.text()
                    raise Exception(f"Groq API error {response.status}: {error_text}")
