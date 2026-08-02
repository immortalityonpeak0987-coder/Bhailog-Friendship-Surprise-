import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({});
  try {
    await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'hello',
    });
    console.log("Success");
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
