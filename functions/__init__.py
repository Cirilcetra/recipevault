from firebase_functions import https_fn
from firebase_admin import initialize_app
import json
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
import openai
import re
import os
from typing import Optional
import requests
from dotenv import load_dotenv
from .main import processVideo

# Initialize Firebase Admin
initialize_app()

# Load environment variables
load_dotenv()

# Configure OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

openai.api_key = OPENAI_API_KEY

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

    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a professional chef who creates clear, detailed recipes."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1000,
        temperature=0.7
    )
    
    return response.choices[0].message.content

def get_video_transcript(video_id: str) -> str:
    transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
    formatter = TextFormatter()
    return formatter.format_transcript(transcript)

@https_fn.on_request()
def processVideo(req: https_fn.Request) -> https_fn.Response:
    """HTTP Cloud Function."""
    if req.method == 'OPTIONS':
        return https_fn.Response(
            '',
            status=204,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '3600'
            }
        )

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }

    try:
        request_json = req.get_json()
        if not request_json or 'url' not in request_json:
            return https_fn.Response(
                json.dumps({'error': 'Missing URL'}),
                status=400,
                headers=headers
            )

        video_url = request_json['url']
        video_id = extract_video_id(video_url)
        
        if not video_id:
            return https_fn.Response(
                json.dumps({'error': 'Invalid YouTube URL'}),
                status=400,
                headers=headers
            )

        try:
            video_details = get_video_details(video_id)
            transcript_text = get_video_transcript(video_id)
            recipe = generate_recipe(transcript_text)

            return https_fn.Response(
                json.dumps({
                    "videoDetails": video_details,
                    "recipe": recipe,
                    "transcript": transcript_text
                }),
                headers=headers
            )
        except Exception as e:
            error_message = str(e)
            status = 404 if "No transcript found" in error_message else 500
            return https_fn.Response(
                json.dumps({'error': error_message}),
                status=status,
                headers=headers
            )

    except Exception as e:
        return https_fn.Response(
            json.dumps({'error': str(e)}),
            status=500,
            headers=headers
        ) 