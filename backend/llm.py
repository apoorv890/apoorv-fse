import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

class LLMProcessor:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )

    async def process(self, text: str, instruction: str = None) -> str:
        """
        Process text using OpenAI's GPT model
        """
        try:
            # Create system message based on instruction or use default
            system_message = (
                instruction if instruction 
                else "You are a helpful assistant that processes transcribed text."
            )
            
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": text}
                ],
                temperature=0.7,
                max_tokens=150
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            raise Exception(f"Error in LLM processing: {str(e)}")
