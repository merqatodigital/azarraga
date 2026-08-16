export type WhatsAppConfig = {
  accessToken: string;
  phoneNumberId: string;
  verifyToken: string;
  appSecret?: string;
  ownerNumber: string;
  apiVersion: string;
};

export type IncomingWhatsAppText = {
  messageId: string;
  from: string;
  text: string;
  timestamp?: string;
};

function required(env: Record<string, unknown>, key: string): string {
  const value = env[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is not configured`);
  return value.trim();
}

export function getWhatsAppConfig(env: Record<string, unknown>): WhatsAppConfig {
  return {
    accessToken: required(env, "WHATSAPP_ACCESS_TOKEN"),
    phoneNumberId: required(env, "WHATSAPP_PHONE_NUMBER_ID"),
    verifyToken: required(env, "WHATSAPP_VERIFY_TOKEN"),
    ownerNumber: normalizePhone(required(env, "WHATSAPP_OWNER_NUMBER")),
    appSecret: typeof env.WHATSAPP_APP_SECRET === "string" ? env.WHATSAPP_APP_SECRET : undefined,
    apiVersion: typeof env.WHATSAPP_API_VERSION === "string" ? env.WHATSAPP_API_VERSION : "v23.0",
  };
}

export function normalizePhone(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export function parseIncomingText(payload: unknown): IncomingWhatsAppText[] {
  const result: IncomingWhatsAppText[] = [];
  const body = payload as any;
  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const message of change?.value?.messages ?? []) {
        if (message?.type !== "text" || !message?.text?.body || !message?.id || !message?.from) continue;
        result.push({
          messageId: String(message.id),
          from: normalizePhone(String(message.from)),
          text: String(message.text.body).trim(),
          timestamp: message.timestamp ? String(message.timestamp) : undefined,
        });
      }
    }
  }
  return result;
}

export async function sendWhatsAppText(config: WhatsAppConfig, to: string, body: string): Promise<unknown> {
  const response = await fetch(`https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizePhone(to),
      type: "text",
      text: { preview_url: false, body },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`WhatsApp send failed (${response.status}): ${JSON.stringify(data)}`);
  return data;
}

export async function verifyMetaSignature(rawBody: string, signature: string | null, appSecret?: string): Promise<boolean> {
  if (!appSecret) return true;
  if (!signature?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = `sha256=${Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return mismatch === 0;
}
