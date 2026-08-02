import { GoogleGenAI } from "@google/genai";
async function test() {
  const ai = new GoogleGenAI({});
  try {
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'hello',
    });
    console.log("2.5 works");
  } catch(e) {
    console.error("2.5 error", e);
  }
}
test();
