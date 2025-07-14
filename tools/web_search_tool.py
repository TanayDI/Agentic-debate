"""
Web search tool for the judge agent
"""

import asyncio
import aiohttp
from typing import List, Dict, Any, Optional
from urllib.parse import quote_plus
import json

from utils.logger import setup_logger

logger = setup_logger(__name__)

class WebSearchTool:
    """Web search tool supporting multiple providers"""
    
    def __init__(self, config: Dict[str, Any], api_keys: Dict[str, str]):
        self.config = config
        self.api_keys = api_keys
        self.provider = config.get("provider", "duckduckgo")
        self.max_results = config.get("max_results", 5)
        self.timeout = config.get("timeout", 30)
        
        logger.info(f"Web search tool initialized with provider: {self.provider}")
    
    async def search(self, query: str) -> List[Dict[str, Any]]:
        """Perform web search using the configured provider"""
        logger.info(f"Searching for: {query}")
        
        try:
            if self.provider == "duckduckgo":
                return await self._search_duckduckgo(query)
            elif self.provider == "tavily":
                return await self._search_tavily(query)
            elif self.provider == "serpapi":
                return await self._search_serpapi(query)
            else:
                raise ValueError(f"Unsupported search provider: {self.provider}")
                
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            return []
    
    async def _search_duckduckgo(self, query: str) -> List[Dict[str, Any]]:
        """Search using DuckDuckGo (free, no API key required)"""
        try:
            # Use DuckDuckGo Instant Answer API
            url = "https://api.duckduckgo.com/"
            params = {
                "q": query,
                "format": "json",
                "no_html": "1",
                "skip_disambig": "1"
            }
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        results = []
                        
                        # Add abstract if available
                        if data.get("Abstract"):
                            results.append({
                                "title": data.get("AbstractText", "DuckDuckGo Summary"),
                                "snippet": data.get("Abstract"),
                                "url": data.get("AbstractURL", ""),
                                "source": "DuckDuckGo"
                            })
                        
                        # Add related topics
                        for topic in data.get("RelatedTopics", [])[:self.max_results-1]:
                            if isinstance(topic, dict) and topic.get("Text"):
                                results.append({
                                    "title": topic.get("Text", "")[:100] + "...",
                                    "snippet": topic.get("Text", ""),
                                    "url": topic.get("FirstURL", ""),
                                    "source": "DuckDuckGo"
                                })
                        
                        # If no results, create a basic search result
                        if not results:
                            results.append({
                                "title": f"Search results for: {query}",
                                "snippet": f"No specific results found for '{query}'. This is a general search topic.",
                                "url": f"https://duckduckgo.com/?q={quote_plus(query)}",
                                "source": "DuckDuckGo"
                            })
                        
                        return results[:self.max_results]
                    
                    else:
                        logger.warning(f"DuckDuckGo API returned status {response.status}")
                        return self._fallback_results(query)
                        
        except Exception as e:
            logger.error(f"DuckDuckGo search failed: {str(e)}")
            return self._fallback_results(query)
    
    async def _search_tavily(self, query: str) -> List[Dict[str, Any]]:
        """Search using Tavily API"""
        api_key = self.api_keys.get("tavily_api_key")
        if not api_key:
            logger.error("Tavily API key not found")
            return self._fallback_results(query)
        
        try:
            url = "https://api.tavily.com/search"
            payload = {
                "api_key": api_key,
                "query": query,
                "search_depth": "basic",
                "include_answer": True,
                "include_images": False,
                "include_raw_content": False,
                "max_results": self.max_results
            }
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        results = []
                        for result in data.get("results", []):
                            results.append({
                                "title": result.get("title", ""),
                                "snippet": result.get("content", ""),
                                "url": result.get("url", ""),
                                "source": "Tavily"
                            })
                        
                        return results
                    else:
                        logger.error(f"Tavily API returned status {response.status}")
                        return self._fallback_results(query)
                        
        except Exception as e:
            logger.error(f"Tavily search failed: {str(e)}")
            return self._fallback_results(query)
    
    async def _search_serpapi(self, query: str) -> List[Dict[str, Any]]:
        """Search using SerpAPI"""
        api_key = self.api_keys.get("serpapi_key")
        if not api_key:
            logger.error("SerpAPI key not found")
            return self._fallback_results(query)
        
        try:
            url = "https://serpapi.com/search"
            params = {
                "api_key": api_key,
                "q": query,
                "engine": "google",
                "num": self.max_results
            }
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        results = []
                        for result in data.get("organic_results", []):
                            results.append({
                                "title": result.get("title", ""),
                                "snippet": result.get("snippet", ""),
                                "url": result.get("link", ""),
                                "source": "Google (SerpAPI)"
                            })
                        
                        return results
                    else:
                        logger.error(f"SerpAPI returned status {response.status}")
                        return self._fallback_results(query)
                        
        except Exception as e:
            logger.error(f"SerpAPI search failed: {str(e)}")
            return self._fallback_results(query)
    
    def _fallback_results(self, query: str) -> List[Dict[str, Any]]:
        """Provide fallback results when search fails"""
        return [{
            "title": f"Search topic: {query}",
            "snippet": f"Unable to retrieve web search results for '{query}'. The debate will proceed with general knowledge.",
            "url": "",
            "source": "Fallback"
        }]
