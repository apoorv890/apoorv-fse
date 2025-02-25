import os
from typing import Dict, List, Optional
import requests
from pydantic import BaseModel
import json
import asyncio
from datetime import datetime, timedelta

class InsightResponse(BaseModel):
    insights: List[str]
    questions: List[str]

class InsightsService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "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")
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.context_window = []  # Store recent context
        self.last_full_analysis = datetime.now()
        self.min_analysis_interval = timedelta(seconds=30)  # Minimum time between full analyses
        
    def _generate_prompt(self, text: str, is_full_analysis: bool = False) -> str:
        if is_full_analysis:
            return f"""As a real-time meeting assistant, analyze this transcript and provide key insights and follow-up questions. Focus on actionable points and important decisions.

Context: This is a live meeting transcript.
Transcript: {text}

Requirements:
1. Provide 2-3 CONCISE key insights (max 15 words each)
2. Suggest 2-3 relevant follow-up questions
3. Focus on the most recent context while maintaining overall meeting coherence

Format response as JSON:
{{
    "insights": ["insight1", "insight2", ...],
    "questions": ["question1", "question2", ...]
}}"""
        else:
            return f"""As a real-time meeting assistant, provide quick insights on this new segment of conversation.
Focus only on new, important information.

New segment: {text}

Requirements:
1. 1-2 VERY CONCISE insights about new information (max 10 words each)
2. 1 relevant follow-up question
3. Ignore redundant or filler content

Format response as JSON:
{{
    "insights": ["insight1", "insight2"],
    "questions": ["question1"]
}}"""

    async def generate_insights(self, text: str) -> InsightResponse:
        # Skip empty text
        if not text.strip():
            return InsightResponse(insights=[], questions=[])
        
        # Add to context window (keep last 500 words)
        words = text.split()
        if len(words) > 500:
            text = " ".join(words[-500:])
        
        # Determine if we should do a full analysis
        time_since_last = datetime.now() - self.last_full_analysis
        is_full_analysis = time_since_last > self.min_analysis_interval
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "mixtral-8x7b-instruct",  # Using Mixtral for better context understanding
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a real-time meeting assistant that provides quick, relevant insights and questions. Be concise and focus on actionable information."
                    },
                    {
                        "role": "user",
                        "content": self._generate_prompt(text, is_full_analysis)
                    }
                ],
                "temperature": 0.3,  # Lower temperature for more focused responses
                "max_tokens": 150,  # Limit response length
                "top_p": 0.9
            }
            
            async with asyncio.timeout(5.0):  # 5-second timeout
                response = requests.post(self.api_url, headers=headers, json=data)
                response.raise_for_status()
                
                result = response.json()
                if "choices" in result and result["choices"]:
                    try:
                        content = result["choices"][0]["message"]["content"]
                        parsed = json.loads(content)
                        
                        # Update last analysis time if this was a full analysis
                        if is_full_analysis:
                            self.last_full_analysis = datetime.now()
                        
                        return InsightResponse(
                            insights=parsed.get("insights", [])[:3],  # Limit to 3 insights
                            questions=parsed.get("questions", [])[:3]  # Limit to 3 questions
                        )
                    except json.JSONDecodeError:
                        print("Error parsing LLM response as JSON")
                        return InsightResponse(insights=[], questions=[])
                
            return InsightResponse(insights=[], questions=[])
            
        except Exception as e:
            print(f"Error generating insights: {e}")
            return InsightResponse(insights=[], questions=[])
