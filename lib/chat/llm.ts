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

function getOpenRouterModels(): string[] {
  const configured = process.env.CHAT_OPENROUTER_MODEL_LIST;
  if (configured) {
    return configured
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const primary = process.env.CHAT_OPENROUTER_MODEL?.trim();
  if (primary && primary !== "openrouter/auto") {
    return [primary, "openrouter/auto"];
  }

  return [primary || "openrouter/auto"];
}

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
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const fragment = clean.slice(firstBrace, lastBrace + 1);
      try {
        const parsed = JSON.parse(fragment) as Partial<ChatAiResponse>;
        if (typeof parsed.answer !== "string" || !Array.isArray(parsed.suggested)) {
          return null;
        }
        return {
          answer: parsed.answer,
          suggested: parsed.suggested.filter((item): item is string => typeof item === "string"),
        };
      } catch {
        return null;
      }
    }
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

  const models = getOpenRouterModels();
  let lastError: string | null = null;

  for (const model of models) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://et-invest-iq.vercel.app",
        "X-Title": "ET InvestIQ",
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
      lastError = `OpenRouter failed (${response.status}) on ${model}: ${errorText}`;
      if (response.status === 429) {
        continue;
      }
      throw new Error(lastError);
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = parseJsonLenient(content);
    if (!parsed && content.trim()) {
      return {
        answer: content.trim(),
        suggested: ["What should I watch next?", "How should I size risk here?"],
      };
    }
    if (parsed) {
      return parsed;
    }

    lastError = `OpenRouter returned empty content on ${model}`;
  }

  throw new Error(lastError || "OpenRouter failed for all configured models");
}

export async function generateChatJSON(
  prompt: string,
  systemInstruction: string
): Promise<ChatAiResponse> {
  const provider = process.env.CHAT_PROVIDER?.toLowerCase().trim();
  if (provider === "openrouter" || Boolean(process.env.CHAT_OPENROUTER_API_KEY)) {
    return generateWithOpenRouter(prompt, systemInstruction);
  }

  return generateStructuredJSON<ChatAiResponse>(prompt, systemInstruction);
}
