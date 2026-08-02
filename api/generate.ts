import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Allow CORS for Vercel/Netlify
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { friend_name, mood, memory, vibe, sender_gender, language } = req.body;

    if (!friend_name || !mood || !memory || !sender_gender || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server misconfiguration: GEMINI_API_KEY is missing.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = vibe === 'bestie' ? `
Act as a ${sender_gender} writing a message to their best friend.
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
- "secret_note": A sweet or funny inside-joke style note in ${language}.
` : `
Act as a ${sender_gender} writing a message to their bro/guy friend.
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
- "secret_note": A funny, inside-joke style decrypted note in ${language}.
`;

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

    return res.status(200).json({
      headline: aiData.headline || "[ DOSTI PROTOCOL ]",
      main_message: aiData.main_message || "Yaadon ka decompression successful.",
      secret_note: aiData.secret_note || "No secrets here."
    });

  } catch (error: any) {
    console.error("API Error:", error);
    if (error?.status === 429 || (error?.message && error.message.includes("quota"))) {
      return res.status(429).json({ error: "API quota exceeded. Please check your Gemini API plan and billing details, or try again later." });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/* 
====================================================================
FRONTEND INTEGRATION INSTRUCTIONS (DB-LESS SHAREABLE LINKS)
====================================================================
Because this application uses a 100% DB-less architecture, we do not 
store the generated card data in a database. Instead, all data is 
stored directly in the URL using Base64 encoding.

How to implement this in the frontend:

1. Call this API and get the JSON response:
   const response = await fetch('/api/generate', { ... });
   const data = await response.json();

2. Encode the JSON payload into a Base64 string:
   // Encode special characters correctly
   const encodedData = btoa(encodeURIComponent(JSON.stringify(data)));

3. Append this string to your application's URL:
   const shareableUrl = \`https://yourdomain.com/?data=\${encodedData}\`;

4. When a user visits the link, decode the URL parameter to render the card:
   const urlParams = new URLSearchParams(window.location.search);
   const dataParam = urlParams.get('data');
   if (dataParam) {
       const decodedData = JSON.parse(decodeURIComponent(atob(dataParam)));
       // Render card using decodedData.headline, main_message, secret_note
   }
====================================================================
*/
