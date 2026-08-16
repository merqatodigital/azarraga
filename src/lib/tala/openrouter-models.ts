export type OpenRouterModel = {
  id: string;
  name: string;
  contextLength: number | null;
  promptPrice: number | null;
  completionPrice: number | null;
  isFree: boolean;
};

type OpenRouterModelPayload = {
  id?: string;
  name?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
};

function price(value?: string): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeOpenRouterModel(model: OpenRouterModelPayload): OpenRouterModel | null {
  if (!model.id) return null;
  const promptPrice = price(model.pricing?.prompt);
  const completionPrice = price(model.pricing?.completion);
  return {
    id: model.id,
    name: model.name || model.id,
    contextLength: model.context_length ?? null,
    promptPrice,
    completionPrice,
    isFree: promptPrice === 0 && completionPrice === 0,
  };
}

export async function listOpenRouterModels(options?: {
  apiKey?: string;
  freeOnly?: boolean;
  signal?: AbortSignal;
}): Promise<OpenRouterModel[]> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (options?.apiKey) headers.authorization = `Bearer ${options.apiKey}`;

  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers,
    signal: options?.signal,
  });
  if (!response.ok) throw new Error(`OpenRouter model discovery failed (${response.status})`);

  const payload = (await response.json()) as { data?: OpenRouterModelPayload[] };
  const models = (payload.data ?? [])
    .map(normalizeOpenRouterModel)
    .filter((model): model is OpenRouterModel => Boolean(model));

  const filtered = options?.freeOnly ? models.filter((model) => model.isFree) : models;
  return filtered.sort((a, b) => {
    if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
