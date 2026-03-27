import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY!
});

export const MODEL = "gemini-2.5-flash-lite";

function parseJsonLenient(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    if (!clean) return null;
    try {
      return JSON.parse(clean);
    } catch (e) {
      console.error("Failed to parse JSON from Gemini:", text);
      throw e;
    }
  }
}

export async function generateJSON(prompt: string, systemInstruction: string) {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    return parseJsonLenient(text);
  } catch (error) {
    console.error("Gemini generateJSON failed:", error);
    throw error;
  }
}

export async function generateStructuredJSON<T>(
  prompt: string,
  systemInstruction: string
): Promise<T> {
  const result = await generateJSON(prompt, systemInstruction);
  if (!result) throw new Error("Gemini returned empty response");
  return result as T;
}

export async function generateText(prompt: string, systemInstruction: string) {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini generateText failed:", error);
    return "";
  }
}

export async function streamChat(
  messages: { role: string; content: string }[],
  systemInstruction: string
) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContentStream({
    model: MODEL,
    contents,
    config: { systemInstruction },
  });
  return response;
}
