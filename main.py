#!/usr/bin/env python3
"""
AgenticDebate - Multi-Agent Debate Orchestration System
Entry point for the debate system
"""

import asyncio
import argparse
import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn

from orchestrator.debate_loop import DebateOrchestrator
from config.settings import load_config, Config
from utils.logger import setup_logger

logger = setup_logger(__name__)

# FastAPI app
app = FastAPI(
    title="AgenticDebate",
    description="Multi-Agent Debate Orchestration System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Allow both ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DebateRequest(BaseModel):
    topic: str
    max_turns: Optional[int] = None
    max_time: Optional[int] = None
    
    # Pro agent configuration
    pro_model: Optional[str] = None
    pro_provider: Optional[str] = None
    pro_temperature: Optional[float] = None
    pro_max_tokens: Optional[int] = None
    
    # Con agent configuration
    con_model: Optional[str] = None
    con_provider: Optional[str] = None
    con_temperature: Optional[float] = None
    con_max_tokens: Optional[int] = None
    
    # Judge agent configuration
    judge_model: Optional[str] = None
    judge_provider: Optional[str] = None
    judge_temperature: Optional[float] = None
    judge_max_tokens: Optional[int] = None
    
    # Tools configuration
    tools: Optional[dict] = None
    
    # API keys
    api_keys: Optional[dict] = None

class DebateResponse(BaseModel):
    topic: str
    winner: str
    reasoning: str
    score: dict
    transcript: list
    metadata: dict

@app.post("/debate", response_model=DebateResponse)
async def start_debate(request: DebateRequest):
    """Start a new debate session"""
    try:
        config = load_config()
        
        # Override config with request parameters
        if request.max_turns:
            config.debate.max_turns = request.max_turns
        if request.max_time:
            config.debate.max_time = request.max_time
        
        # Update pro agent configuration
        if request.pro_model:
            config.agents.pro.model = request.pro_model
        if request.pro_provider:
            config.agents.pro.provider = request.pro_provider
        if request.pro_temperature is not None:
            config.agents.pro.temperature = request.pro_temperature
        if request.pro_max_tokens:
            config.agents.pro.max_tokens = request.pro_max_tokens
        
        # Update con agent configuration
        if request.con_model:
            config.agents.con.model = request.con_model
        if request.con_provider:
            config.agents.con.provider = request.con_provider
        if request.con_temperature is not None:
            config.agents.con.temperature = request.con_temperature
        if request.con_max_tokens:
            config.agents.con.max_tokens = request.con_max_tokens
        
        # Update judge agent configuration
        if request.judge_model:
            config.agents.judge.model = request.judge_model
        if request.judge_provider:
            config.agents.judge.provider = request.judge_provider
        if request.judge_temperature is not None:
            config.agents.judge.temperature = request.judge_temperature
        if request.judge_max_tokens:
            config.agents.judge.max_tokens = request.judge_max_tokens
        
        # Update tools configuration
        if request.tools:
            config.tools = request.tools
        
        # Update API keys from request
        if request.api_keys:
            config.api_keys.update(request.api_keys)
        
        orchestrator = DebateOrchestrator(config)
        result = await orchestrator.run_debate(request.topic)
        
        return DebateResponse(**result)
        
    except Exception as e:
        logger.error(f"Debate failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/debate/stream")
async def stream_debate(request: DebateRequest):
    """Start a new debate session with real-time streaming"""
    async def generate():
        try:
            config = load_config()
            
            # Override config with request parameters
            if request.max_turns:
                config.debate.max_turns = request.max_turns
            if request.max_time:
                config.debate.max_time = request.max_time
            
            # Update pro agent configuration
            if request.pro_model:
                config.agents.pro.model = request.pro_model
            if request.pro_provider:
                config.agents.pro.provider = request.pro_provider
            if request.pro_temperature is not None:
                config.agents.pro.temperature = request.pro_temperature
            if request.pro_max_tokens:
                config.agents.pro.max_tokens = request.pro_max_tokens
            
            # Update con agent configuration
            if request.con_model:
                config.agents.con.model = request.con_model
            if request.con_provider:
                config.agents.con.provider = request.con_provider
            if request.con_temperature is not None:
                config.agents.con.temperature = request.con_temperature
            if request.con_max_tokens:
                config.agents.con.max_tokens = request.con_max_tokens
            
            # Update judge agent configuration
            if request.judge_model:
                config.agents.judge.model = request.judge_model
            if request.judge_provider:
                config.agents.judge.provider = request.judge_provider
            if request.judge_temperature is not None:
                config.agents.judge.temperature = request.judge_temperature
            if request.judge_max_tokens:
                config.agents.judge.max_tokens = request.judge_max_tokens
            
            # Update tools configuration
            if request.tools:
                config.tools = request.tools
            
            # Update API keys from request
            if request.api_keys:
                config.api_keys.update(request.api_keys)
            
            orchestrator = DebateOrchestrator(config)
            
            # Stream the debate with real-time updates
            async for update in orchestrator.stream_debate(request.topic):
                yield f"data: {json.dumps(update)}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming debate failed: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "debate-mirror-mcp"}

async def cli_mode():
    """Command line interface mode"""
    parser = argparse.ArgumentParser(description="AgenticDebate CLI")
    parser.add_argument("topic", help="Debate topic")
    parser.add_argument("--max-turns", type=int, help="Maximum number of turns")
    parser.add_argument("--max-time", type=int, help="Maximum time in seconds")
    parser.add_argument("--config", help="Config file path")
    parser.add_argument("--output", help="Output file for results")
    
    args = parser.parse_args()
    
    try:
        config_path = args.config if args.config else None
        config = load_config(config_path)
        
        if args.max_turns:
            config.debate.max_turns = args.max_turns
        if args.max_time:
            config.debate.max_time = args.max_time
        
        orchestrator = DebateOrchestrator(config)
        result = await orchestrator.run_debate(args.topic)
        
        # Print results
        print(f"\n{'='*60}")
        print(f"DEBATE RESULTS: {args.topic}")
        print(f"{'='*60}")
        print(f"Winner: {result['winner']}")
        print(f"Reasoning: {result['reasoning']}")
        print(f"Score: {result['score']}")
        print(f"{'='*60}")
        
        # Save to file if specified
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"Results saved to {args.output}")
            
    except Exception as e:
        logger.error(f"CLI execution failed: {str(e)}")
        print(f"Error: {str(e)}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="AgenticDebate")
    parser.add_argument("--mode", choices=["api", "cli"], default="cli", 
                       help="Run mode: api (FastAPI server) or cli (command line)")
    parser.add_argument("--host", default="0.0.0.0", help="API host")
    parser.add_argument("--port", type=int, default=8000, help="API port")
    
    # Parse only known args to allow topic in CLI mode
    args, remaining = parser.parse_known_args()
    
    if args.mode == "api":
        print("Starting AgenticDebate API server...")
        uvicorn.run(app, host=args.host, port=args.port)
    else:
        # Re-parse with remaining args for CLI mode
        import sys
        sys.argv = [sys.argv[0]] + remaining
        asyncio.run(cli_mode())

if __name__ == "__main__":
    main()
