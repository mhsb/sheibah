// We remove the static import to prevent load-time errors.
// import { GoogleGenAI } from "@google/genai";

export const optimizePersianText = async (text: string): Promise<string> => {
  try {
    // Dynamic import for safety
    const { GoogleGenAI } = await import("@google/genai");

    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
    if (!apiKey) {
      console.error("API Key missing. Ensure process.env.API_KEY is set.");
      throw new Error("API_KEY is missing from the environment.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';
    
    // Limit input size for safety and speed
    const safeText = text.substring(0, 30000);

    const prompt = `
      You are an expert Persian editor. Your task is to format the following raw text extracted from a document for a mobile reading experience.
      
      Rules:
      1. Correct any Persian spacing issues (Half-spaces/Zero-width non-joiner).
      2. Ensure standard Persian punctuation.
      3. Do NOT summarize. Keep the full content.
      4. Return ONLY the formatted text. No markdown code blocks, no explanations.
      
      Text to process:
      ${safeText} 
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || text; // Fallback to original if empty
  } catch (error) {
    console.error("Gemini optimization failed:", error);
    // Fail safe: return original text so user still gets a doc
    return text; 
  }
};