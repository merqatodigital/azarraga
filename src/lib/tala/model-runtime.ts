export type TalaModelConfig = { apiKey: string; model: string };

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

async function request(config: TalaModelConfig, messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, maxTokens?: number) {
  if (!config.apiKey) throw new Error("OpenRouter API key is required");
  if (!config.model) throw new Error("TALA model is required");
  const response = await fetch(OPENROUTER_CHAT_URL, { method: "POST", headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://azarraga.merqato.digital", "X-Title": "Azarraga TALA" }, body: JSON.stringify({ model: config.model, temperature: 0.2, max_tokens: maxTokens, messages }) });
  const payload = (await response.json().catch(() => ({}))) as any;
  if (!response.ok) throw new Error(payload?.error?.message || `OpenRouter request failed (${response.status})`);
  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("OpenRouter returned an empty response");
  return text.trim();
}

export async function testTalaModel(config: TalaModelConfig) {
  const reply = await request(config, [{ role: "system", content: "You are TALA, the private operations agent for Azarraga Glass & Aluminum. Never invent business data." }, { role: "user", content: "Connection test. Reply only: TALA model connected." }], 60);
  return { ok: true as const, model: config.model, reply };
}

export async function runTalaText(config: TalaModelConfig, messages: Array<{ role: "system" | "user" | "assistant"; content: string }>) { return request(config, messages); }
