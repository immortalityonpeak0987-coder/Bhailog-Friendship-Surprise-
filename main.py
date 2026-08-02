import os
import uuid
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from supabase import create_client, Client
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize Supabase client (only if credentials are provided)
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Gemini API
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

app = FastAPI(
    title="BhaiLog API",
    description="AI-powered friendship card generator API",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for frontend connectivity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    friend_name: str = Field(..., description="Name of the friend")
    mood: str = Field(..., description="Mood or vibe of the card")
    memory: str = Field(..., description="Special memory to include")

class GeneratedCard(BaseModel):
    card_id: str
    headline: str
    main_message: str
    secret_note: str

@app.post("/api/generate", response_model=GeneratedCard)
async def generate_card(request: GenerateRequest):
    if not GEMINI_API_KEY or not supabase:
         raise HTTPException(status_code=500, detail="Server misconfiguration: Missing API keys.")
         
    try:
        # Construct the system prompt
        prompt = f"""
        Act as a witty, cool friendship card creator (a 'Bhai' or 'Bro').
        Use Hinglish/regional slang like 'Dosti', 'Yaadon', 'Bhai'.
        Create a friendship card based on the following details:
        - Friend's Name: {request.friend_name}
        - Mood: {request.mood}
        - Special Memory: {request.memory}
        
        You MUST respond ONLY with a strictly structured JSON object containing exactly these keys:
        - "headline": A short, catchy title (e.g., THE LEGENDARY BRO-CODE).
        - "main_message": A heartfelt but witty message in Hinglish incorporating the memory.
        - "secret_note": A funny, inside-joke style decrypted note.
        """
        
        # Call Gemini AI API with JSON enforcement
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        # Parse AI response
        ai_data = json.loads(response.text)
        
        # Ensure all expected keys exist
        headline = ai_data.get("headline", "[ DOSTI PROTOCOL ]")
        main_message = ai_data.get("main_message", "Yaadon ka decompression successful.")
        secret_note = ai_data.get("secret_note", "No secrets here.")

        # Generate unique UUID for the card
        card_id = str(uuid.uuid4())
        
        # Insert into Supabase table named 'cards'
        # Assumes a table 'cards' exists with columns: id, friend_name, mood, memory, headline, main_message, secret_note
        db_response = supabase.table("cards").insert({
            "id": card_id,
            "friend_name": request.friend_name,
            "mood": request.mood,
            "memory": request.memory,
            "headline": headline,
            "main_message": main_message,
            "secret_note": secret_note
        }).execute()
        
        return GeneratedCard(
            card_id=card_id,
            headline=headline,
            main_message=main_message,
            secret_note=secret_note
        )
        
    except Exception as e:
        print(f"Error generating card: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate card due to an internal error.")

@app.get("/api/card/{card_id}", response_model=GeneratedCard)
async def get_card(card_id: str):
    if not supabase:
         raise HTTPException(status_code=500, detail="Server misconfiguration: Missing Supabase keys.")
         
    try:
        # Retrieve card from Supabase
        response = supabase.table("cards").select("*").eq("id", card_id).execute()
        
        # Check if record exists
        if not response.data:
            raise HTTPException(status_code=404, detail="Card not found.")
            
        card_data = response.data[0]
        
        return GeneratedCard(
            card_id=card_data["id"],
            headline=card_data["headline"],
            main_message=card_data["main_message"],
            secret_note=card_data["secret_note"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching card: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve card due to an internal error.")

# To run locally: uvicorn main:app --reload
