import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', '.data') : path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

app.post("/api/generate", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is missing. Please add it to your Vercel Environment Variables." });
    }
    
    const { friend_name, mood, memory, vibe, sender_gender, language } = req.body;
    if (!friend_name || !mood || !memory || !sender_gender || !language) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = vibe === 'bestie' ? `Act as a ${sender_gender} writing a message to their best friend.
Relationship dynamic: This is a strictly platonic, fun, and wholesome friendship.
If the sender is a Male: act like a guy teasing or appreciating his girl best friend (no romantic GF/BF vibes, just pure bestie/yaar vibes). Use slang like 'Yaar', 'Bestie', 'Pagal'.
If the sender is a Female: use fun girly bestie slang like 'Babe', 'Sis', 'Bestie'.

Create a cute and wholesome friendship card based on the following details:
- Friend's Name: ${friend_name}
- Mood: ${mood}
- Special Memory: ${memory}

You MUST write the response primarily in the requested language: ${language}.
If the language is Hinglish, blend Hindi and English naturally.
If the language is Hindi or Bengali, you can use the native script BUT keep the tone modern, casual, and conversational (Gen-Z/Millennial style). Do NOT use pure/formal/kattar words. Any English loan words or slang (like 'Bestie', 'Bro', 'Time', etc.) MUST be written in the English alphabet, do NOT transliterate English words into the native script.

Please sprinkle a few fitting emojis naturally throughout the generated message.

You MUST respond ONLY with a strictly structured JSON object containing exactly these keys:
- "headline": A short, catchy cute title.
- "main_message": A heartfelt, fun message incorporating the memory, in ${language}.
- "secret_note": A sweet or funny inside-joke style note in ${language}.` : `Act as a ${sender_gender} writing a message to their bro/guy friend.
Use Hinglish/regional slang like 'Dosti', 'Yaadon', 'Bhai', 'Yaar', 'Bro'.

Create a friendship card based on the following details:
- Friend's Name: ${friend_name}
- Mood: ${mood}
- Special Memory: ${memory}

You MUST write the response primarily in the requested language: ${language}.
If the language is Hinglish, blend Hindi and English naturally.
If the language is Hindi or Bengali, you can use the native script BUT keep the tone modern, casual, and conversational (Gen-Z/Millennial style). Do NOT use pure/formal/kattar words. Any English loan words or slang (like 'Bestie', 'Bro', 'Time', etc.) MUST be written in the English alphabet, do NOT transliterate English words into the native script.

Please sprinkle a few fitting emojis naturally throughout the generated message.

You MUST respond ONLY with a strictly structured JSON object containing exactly these keys:
- "headline": A short, catchy title.
- "main_message": A heartfelt but witty message incorporating the memory, in ${language}.
- "secret_note": A funny, inside-joke style decrypted note in ${language}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (!response?.text) {
      throw new Error("Failed to generate content from AI.");
    }

    const aiData = JSON.parse(response.text);
    
    res.json({
      headline: aiData.headline || "[ DOSTI PROTOCOL ]",
      main_message: aiData.main_message || "Yaadon ka decompression successful.",
      secret_note: aiData.secret_note || "No secrets here."
    });

  } catch (error: any) {
    console.error("Generate error:", error);
    if (error?.status === 429 || (error?.message && error.message.includes("quota"))) {
      return res.status(429).json({ error: "API quota exceeded. Please check your Gemini API plan and billing details, or try again later." });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/save", (req, res) => {
  try {
    const data = req.body;
    const id = crypto.randomUUID().split('-')[0];
    const filepath = path.join(DATA_DIR, `${id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(data));
    res.json({ id });
  } catch (e) {
    console.error("Save error:", e);
    res.status(500).json({ error: "Failed to save data" });
  }
});

app.get("/api/load/:id", (req, res) => {
  try {
    const filepath = path.join(DATA_DIR, `${req.params.id}.json`);
    if (fs.existsSync(filepath)) {
      const data = fs.readFileSync(filepath, 'utf-8');
      res.json(JSON.parse(data));
    } else {
      res.status(404).json({ error: "Not found" });
    }
  } catch (e) {
    console.error("Load error:", e);
    res.status(500).json({ error: "Failed to load data" });
  }
});

async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

if (!process.env.VERCEL) {
  setupVite().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
