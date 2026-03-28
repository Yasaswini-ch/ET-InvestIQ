import { generateStructuredJSON } from "@/lib/gemini";

type ChatAiResponse = {
  answer: string;
  suggested: string[];
};

type OpenRouterChoice = {
  message?: {
    content?: string;
  };
};

type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
};

function parseJsonLenient(text: string): ChatAiResponse | null {
  const clean = text.replace(/```json\n?|\n?```/g, "").trim();
  if (!clean) return null;
  try {
    const parsed = JSON.parse(clean) as Partial<ChatAiResponse>;
    if (typeof parsed.answer !== "string") return null;
    if (!Array.isArray(parsed.suggested)) return null;
    return {
      answer: parsed.answer,
      suggested: parsed.suggested.filter((item): item is string => typeof item === "string"),
    };
  } catch {
    return null;
  }
}

async function generateWithOpenRouter(
  prompt: string,
  systemInstruction: string
): Promise<ChatAiResponse> {
  const apiKey = process.env.CHAT_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("CHAT_OPENROUTER_API_KEY is missing");
  }

  const model = process.env.CHAT_OPENROUTER_MODEL || "openrouter/auto";
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content ?? "";
  const parsed = parseJsonLenient(content);
  if (!parsed) {
    throw new Error("OpenRouter returned invalid JSON content");
  }
  return parsed;
}

export async function generateChatJSON(
  prompt: string,
  systemInstruction: string
): Promise<ChatAiResponse> {
  if (process.env.CHAT_PROVIDER === "openrouter") {
    return generateWithOpenRouter(prompt, systemInstruction);
  }

  return generateStructuredJSON<ChatAiResponse>(prompt, systemInstruction);
}
