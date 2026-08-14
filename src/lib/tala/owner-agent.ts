import { sendWhatsAppText, type WhatsAppConfig, type IncomingWhatsAppText } from "./whatsapp";

export type OwnerAgentDeps = {
  config: WhatsAppConfig;
  env: Record<string, unknown>;
};

function systemStatus(): string {
  return "TALA is online. WhatsApp owner channel is connected. Business tools are being connected to Azarraga's Supabase backoffice.";
}

function localCommand(text: string): string | null {
  const command = text.trim().toLowerCase();
  if (["status", "tala status", "tala, status", "tala status?"].includes(command)) return systemStatus();
  if (["help", "tala help", "tala, help"].includes(command)) {
    return "TALA is your Azarraga business agent. You can ask for status now. Leads, invoices, collections, payments, projects and daily briefs will activate as their Supabase tools come online.";
  }
  return null;
}

async function callOpenRouter(env: Record<string, unknown>, ownerText: string): Promise<string> {
  const key = env.OPENROUTER_API_KEY;
  if (typeof key !== "string" || !key) return "I received your message. My Azarraga business tools are still being connected. Send 'status' to check the connection.";
  const model = typeof env.TALA_MODEL === "string" && env.TALA_MODEL ? env.TALA_MODEL : "openai/gpt-4.1-mini";
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are TALA, the private text-only business operations agent for Azarraga Glass & Aluminum in Palawan. You communicate concisely with the business owner through WhatsApp. Never invent invoices, balances, customers, prices, payments, leads, project status, or other operational facts. Business facts must come from tools. At this stage no business-data tools are connected, so if asked for business facts, say that the relevant tool is being connected rather than guessing. Do not call yourself a resort concierge or voice agent.",
        },
        { role: "user", content: ownerText },
      ],
    }),
  });
  const data = (await response.json().catch(() => ({}))) as any;
  if (!response.ok) throw new Error(`OpenRouter failed (${response.status}): ${JSON.stringify(data)}`);
  return data?.choices?.[0]?.message?.content?.trim() || "I received your message.";
}

export async function handleOwnerMessage(message: IncomingWhatsAppText, deps: OwnerAgentDeps): Promise<void> {
  if (message.from !== deps.config.ownerNumber) return;
  const reply = localCommand(message.text) ?? (await callOpenRouter(deps.env, message.text));
  await sendWhatsAppText(deps.config, message.from, reply);
}

export async function sendOwnerUpdate(config: WhatsAppConfig, text: string): Promise<unknown> {
  return sendWhatsAppText(config, config.ownerNumber, text);
}
