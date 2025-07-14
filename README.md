# Debate Mirror MCP

A sophisticated multi-agent debate orchestration system that simulates structured debates between AI agents with research capabilities and impartial judging.

## 🧠 System Overview

The Debate Mirror MCP creates structured debates between two LLM agents:
- **PRO Agent**: Argues in favor of the topic
- **CON Agent**: Argues against the topic  
- **JUDGE Agent**: Researches the topic and evaluates the debate

### Key Features

- **Multi-Provider LLM Support**: Google Gemini, OpenAI, Anthropic, xAI, Groq
- **Web Search Integration**: DuckDuckGo, Tavily, SerpAPI for research
- **Structured Debate Flow**: Research → Debate → Judgment
- **Configurable Parameters**: Turn limits, time limits, model selection
- **Memory Management**: Full conversation history tracking
- **Multiple Interfaces**: FastAPI server and CLI

## 🚀 Quick Start

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd debate-mirror-mcp
\`\`\`

2. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

3. Configure API keys:
\`\`\`bash
export GOOGLE_API_KEY="your-google-api-key"
export OPENAI_API_KEY="your-openai-api-key"
# Add other API keys as needed
\`\`\`

### CLI Usage

Run a debate from the command line:

\`\`\`bash
# Basic debate
python main.py "Should artificial intelligence be regulated by governments?"

# With custom parameters
python main.py "Climate change requires immediate action" --max-turns 8 --max-time 1200

# Save results to file
python main.py "Universal basic income should be implemented" --output results.json
\`\`\`

### API Server

Start the FastAPI server:

\`\`\`bash
python main.py --mode api --host 0.0.0.0 --port 8000 Server

Start the FastAPI server:

\`\`\`bash
python main.py --mode api --host 0.0.0.0 --port 8000
\`\`\`

Then make requests to the API:

\`\`\`bash
# Start a debate via API
curl -X POST "http://localhost:8000/debate" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Should artificial intelligence be regulated by governments?",
    "max_turns": 10,
    "pro_model": "gemini-2.0-flash-exp",
    "con_model": "gemini-2.0-flash-exp"
  }'

# Health check
curl http://localhost:8000/health
\`\`\`

## ⚙️ Configuration

### Config File

Edit `config/config.yaml` to customize:

\`\`\`yaml
debate:
  max_turns: 10
  max_time: 1800  # 30 minutes
  turn_timeout: 120  # 2 minutes per turn

agents:
  pro:
    model: "gemini-2.0-flash-exp"
    provider: "google"
    temperature: 0.7
  con:
    model: "gpt-4"
    provider: "openai"
    temperature: 0.7
  judge:
    model: "claude-3-sonnet-20240229"
    provider: "anthropic"
    temperature: 0.3

tools:
  web_search:
    provider: "duckduckgo"  # or "tavily", "serpapi"
    max_results: 5
\`\`\`

### Environment Variables

Set API keys via environment variables:

\`\`\`bash
export GOOGLE_API_KEY="your-key"
export OPENAI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"
export XAI_API_KEY="your-key"
export GROQ_API_KEY="your-key"
export TAVILY_API_KEY="your-key"  # Optional
export SERPAPI_KEY="your-key"     # Optional
\`\`\`

## 🏗️ Architecture

### Project Structure

\`\`\`
debate-mirror-mcp/
├── main.py                 # Entry point
├── config/
│   ├── settings.py         # Configuration management
│   └── config.yaml         # Default configuration
├── agents/
│   ├── base_agent.py       # Base agent class
│   ├── pro_agent.py        # PRO argument agent
│   ├── con_agent.py        # CON argument agent
│   └── judge_agent.py      # Research and judgment agent
├── orchestrator/
│   ├── debate_loop.py      # Main orchestration logic
│   ├── turn_manager.py     # Turn and timing management
│   └── memory_manager.py   # Conversation memory
├── tools/
│   └── web_search_tool.py  # Web search integration
├── utils/
│   ├── llm_client.py       # Multi-provider LLM client
│   └── logger.py           # Logging utilities
├── prompts/
│   ├── pro_agent.txt       # PRO agent system prompt
│   ├── con_agent.txt       # CON agent system prompt
│   └── judge_agent.txt     # JUDGE agent system prompt
└── requirements.txt
\`\`\`

### System Flow

1. **Research Phase**: Judge agent searches the web for topic information
2. **Debate Phase**: PRO and CON agents alternate arguments
3. **Judgment Phase**: Judge evaluates the full debate and declares winner

### Agent Communication

- Agents are stateless between turns
- Memory manager maintains conversation history
- Turn manager enforces time and turn limits
- Each agent receives full context for informed responses

## 🔧 Supported Providers

### LLM Providers

| Provider | Models | API Key Required |
|----------|--------|------------------|
| Google | gemini-2.0-flash-exp, gemini-pro | GOOGLE_API_KEY |
| OpenAI | gpt-4, gpt-3.5-turbo | OPENAI_API_KEY |
| Anthropic | claude-3-sonnet, claude-3-haiku | ANTHROPIC_API_KEY |
| xAI | grok-beta | XAI_API_KEY |
| Groq | llama2-70b-4096, mixtral-8x7b | GROQ_API_KEY |

### Search Providers

| Provider | Features | API Key Required |
|----------|----------|------------------|
| DuckDuckGo | Free, basic search | No |
| Tavily | AI-optimized search | TAVILY_API_KEY |
| SerpAPI | Google search results | SERPAPI_KEY |

## 📊 Example Output

\`\`\`json
{
  "topic": "Should artificial intelligence be regulated by governments?",
  "winner": "PRO",
  "reasoning": "The PRO side presented stronger evidence-based arguments...",
  "score": {
    "pro_score": 78,
    "con_score": 65
  },
  "transcript": [
    {
      "role": "pro",
      "content": "Government regulation of AI is essential...",
      "timestamp": 1703123456.789,
      "metadata": {"turn": 1}
    }
  ],
  "metadata": {
    "duration": 245.6,
    "total_turns": 8,
    "research_context": "Research summary..."
  }
}
\`\`\`

## 🛠️ Development

### Adding New Providers

1. Extend `LLMClient` in `utils/llm_client.py`
2. Add provider-specific generation method
3. Update configuration schema
4. Add API key validation

### Custom Tools

1. Create tool class in `tools/`
2. Implement async methods
3. Register with judge agent
4. Update configuration

### Prompt Engineering

Modify prompt templates in `prompts/` directory:
- `pro_agent.txt`: PRO argument instructions
- `con_agent.txt`: CON argument instructions  
- `judge_agent.txt`: Research and judgment guidelines

## 🚨 Troubleshooting

### Common Issues

**API Key Errors**
\`\`\`bash
# Verify keys are set
echo $GOOGLE_API_KEY
\`\`\`

**Rate Limiting**
- Reduce `temperature` or `max_tokens`
- Add delays between requests
- Use different providers for different agents

**Search Failures**
- DuckDuckGo is free but limited
- Tavily/SerpAPI provide better results with API keys
- System falls back gracefully on search failures

### Logging

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
