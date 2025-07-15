#!/usr/bin/env python3
"""
Test script to verify the updated API integration
"""

import asyncio
import aiohttp
import json

async def test_updated_api():
    """Test the updated API with full configuration"""
    
    url = "http://localhost:8000/debate/stream"
    
    # Test payload with full configuration
    payload = {
        "topic": "Should renewable energy be prioritized over nuclear energy?",
        "max_turns": 3,
        "max_time": 600,
        "pro_model": "gemini-1.5-flash",
        "pro_provider": "google",
        "pro_temperature": 0.7,
        "pro_max_tokens": 800,
        "con_model": "gemini-1.5-flash",
        "con_provider": "google",
        "con_temperature": 0.7,
        "con_max_tokens": 800,
        "judge_model": "gemini-1.5-flash",
        "judge_provider": "google",
        "judge_temperature": 0.3,
        "judge_max_tokens": 1000,
        "tools": {
            "web_search": {
                "provider": "duckduckgo",
                "max_results": 5,
                "timeout": 30
            }
        },
        "api_keys": {
            "google_api_key": "AIzaSyBmoOXwkGo08RDWn_ENtANqs1N-fxZMgYw"
        }
    }
    
    print(f"Testing updated API endpoint: {url}")
    print(f"Payload keys: {list(payload.keys())}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                print(f"Response status: {response.status}")
                
                if response.status == 200:
                    print("✅ SUCCESS: API endpoint is working with full configuration!")
                    
                    message_count = 0
                    # Read the streaming response
                    async for line in response.content:
                        if line:
                            decoded_line = line.decode('utf-8').strip()
                            if decoded_line.startswith('data: '):
                                try:
                                    data = json.loads(decoded_line[6:])  # Remove 'data: ' prefix
                                    
                                    if data.get('type') == 'message':
                                        message_count += 1
                                        role = data['message']['role']
                                        content_preview = data['message']['content'][:100] + "..." if len(data['message']['content']) > 100 else data['message']['content']
                                        print(f"  📄 Message {message_count} ({role}): {content_preview}")
                                    elif data.get('type') == 'phase':
                                        print(f"  🔄 Phase: {data['phase']}")
                                    elif data.get('type') == 'complete':
                                        print(f"  🏆 Winner: {data['result']['winner']}")
                                        print(f"  📊 Score: {data['result']['score']}")
                                        print(f"  ⏱️ Duration: {data['result']['metadata']['duration']:.2f}s")
                                        break
                                    elif data.get('type') == 'error':
                                        print(f"  ❌ Error: {data['error']}")
                                        break
                                except json.JSONDecodeError as e:
                                    print(f"  ⚠️ JSON decode error: {e}")
                                    
                                # Break after a reasonable number of messages for testing
                                if message_count >= 10:
                                    print("  ... (truncated for testing)")
                                    break
                else:
                    response_text = await response.text()
                    print(f"❌ ERROR: API request failed with status {response.status}")
                    print(f"Response: {response_text}")
    except Exception as e:
        print(f"❌ ERROR: Exception occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test_updated_api())
