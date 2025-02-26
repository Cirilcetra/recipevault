from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
import openai
import re
import os
from typing import Optional
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get API key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

# Configure OpenAI client - simplified initialization
client = openai.OpenAI(api_key=OPENAI_API_KEY)

class VideoRequest(BaseModel):
    url: str

def extract_video_id(url: str) -> Optional[str]:
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def get_video_details(video_id: str):
    try:
        api_key = os.getenv("YOUTUBE_API_KEY")
        if not api_key:
            # Return basic details if no API key is configured
            return {
                "title": "YouTube Video",
                "channelTitle": "Unknown Channel",
                "description": ""
            }
            
        url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet&id={video_id}&key={api_key}"
        
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if data.get("items"):
                snippet = data["items"][0]["snippet"]
                return {
                    "title": snippet["title"],
                    "channelTitle": snippet["channelTitle"],
                    "description": snippet["description"]
                }
        
        # Return basic details if API request fails
        return {
            "title": "YouTube Video",
            "channelTitle": "Unknown Channel",
            "description": ""
        }
    except Exception as e:
        print(f"Error fetching video details: {e}")
        # Return basic details on error
        return {
            "title": "YouTube Video",
            "channelTitle": "Unknown Channel",
            "description": ""
        }

def generate_recipe(transcript: str) -> str:
    prompt = f"""
    Based on this cooking video transcript, create a detailed recipe with the following format:

    # Title
    A brief 2-3 sentence summary of the dish

    ## Ingredients
    - List all ingredients with measurements

    ## Steps
    1. Detailed cooking steps
    2. Include timing and temperature where mentioned
    3. Include specific techniques described

    ## Tips and Notes
    - Include any special tips, variations, or notes mentioned in the video

    Transcript:
    {transcript}
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a professional chef who creates clear, detailed recipes."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1000,
        temperature=0.7
    )
    
    return response.choices[0].message.content

@app.post("/process-video")
async def process_video(request: VideoRequest):
    try:
        # Extract video ID
        video_id = extract_video_id(request.url)
        if not video_id:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")

        # Get video details - now won't raise an exception
        video_details = get_video_details(video_id)

        # Get transcript
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        formatter = TextFormatter()
        transcript_text = formatter.format_transcript(transcript)

        # Generate recipe
        recipe = generate_recipe(transcript_text)

        return {
            "videoDetails": video_details,
            "recipe": recipe,
            "transcript": transcript_text
        }

    except Exception as e:
        error_message = str(e)
        if "No transcript found" in error_message:
            raise HTTPException(status_code=404, detail="No transcript available for this video")
        raise HTTPException(status_code=500, detail=error_message)

@app.get("/")
async def root():
    return {"message": "Recipe API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 