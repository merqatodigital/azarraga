export type OpenRouterModel = {
  id: string;
  name?: string;
  pricing?: { prompt?: string; completion?: string };
  context_length?: number;
};

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

const numericPrice = (value?: string) => {
  const parsed = Number(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
};

export function isFreeOpenRouterModel(model: OpenRouterModel): boolean {
  return numericPrice(model.pricing?.prompt) === 0 && numericPrice(model.pricing?.completion) === 0;
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
  return (await listOpenRouterModels(apiKey))
    .filter(isFreeOpenRouterModel)
    .sort((a, b) => (b.context_length ?? 0) - (a.context_length ?? 0));
}
