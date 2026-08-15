export type OpenRouterModel = {
  id: string;
  name?: string;
  pricing?: { prompt?: string; completion?: string };
  context_length?: number;
};

export type TalaModelConfig = {
  apiKey: string;
  model: string;
};

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

function price(value?: string): number {
  const parsed = Number(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isFreeOpenRouterModel(model: OpenRouterModel): boolean {
  return price(model.pricing?.prompt) === 0 && price(model.pricing?.completion) === 0;
}

export async function listOpenRouterModels(apiKey?: string): Promise<OpenRouterModel[]> {
  const response = await fetch(OPENROUTER_MODELS_URL, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
  });
  if (!response.ok) throw new Error(`OpenRouter model discovery failed (${response.status})`);
  const payload = (await response.json()) as { data?: OpenRouterModel[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function listFreeOpenRouterModels(apiKey?: string): Promise<OpenRouterModel[]> {
  const models = await listOpenRouterModels(apiKey);
  return models.filter(isFreeOpenRouterModel).sort((a, b) => (b.context_length ?? 0) - (a.context_length ?? 0));
}

export async function testTalaModel(config: TalaModelConfig): Promise<{ ok: true; model: string; reply: string }> {
  if (!config.apiKey) throw new Error("OpenRouter API key is required");
  if (!config.model) throw new Error("TALA model is required");

  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://azarraga.merqato.digital",
      "X-Title": "Azarraga TALA",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      max_tokens: 60,
      messages: [
        {
          role: "system",
          content: "You are TALA, the private business operations agent for Azarraga Glass & Aluminum. Reply briefly and never invent business data.",
        },
        { role: "user", content: "Connection test. Reply only: TALA model connected." },
      ],
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as any;
  if (!response.ok) {
    const message = payload?.error?.message || `OpenRouter test failed (${response.status})`;
    throw new Error(message);
  }

  return {
    ok: true,
    model: config.model,
    reply: payload?.choices?.[0]?.message?.content?.trim() || "TALA model connected.",
  };
}

export async function runTalaText(
  config: TalaModelConfig,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
): Promise<string> {
  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://azarraga.merqato.digital",
      "X-Title": "Azarraga TALA",
    },
    body: JSON.stringify({ model: config.model, temperature: 0.2, messages }),
  });
  const payload = (await response.json().catch(() => ({}))) as any;
  if (!response.ok) throw new Error(payload?.error?.message || `OpenRouter request failed (${response.status})`);
  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("OpenRouter returned an empty response");
  return text.trim();
}
