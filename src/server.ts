import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { getWhatsAppConfig, parseIncomingText, verifyMetaSignature } from "./lib/tala/whatsapp";
import { handleOwnerMessage, sendOwnerUpdate } from "./lib/tala/owner-agent";

type ServerEntry = { fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response };
type ExecutionContextLike = { waitUntil?: (promise: Promise<unknown>) => void };
let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) serverEntryPromise = import("@tanstack/react-start/server-entry").then((m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)));
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), { status: 500, headers: { "content-type": "text/html; charset=utf-8" } });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return false; }
  if (!payload || Array.isArray(payload) || typeof payload !== "object") return false;
  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) return false;
  return fields.unhandled === true && fields.message === "HTTPError" && (fields.status === undefined || fields.status === responseStatus);
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) return response;
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

async function handleWhatsAppWebhook(request: Request, env: Record<string, unknown>, ctx: ExecutionContextLike): Promise<Response> {
  let config;
  try { config = getWhatsAppConfig(env); } catch (error) { console.error(error); return new Response("WhatsApp is not configured", { status: 503 }); }
  if (request.method === "GET") {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === config.verifyToken && challenge) return new Response(challenge, { status: 200 });
    return new Response("Forbidden", { status: 403 });
  }
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const rawBody = await request.text();
  if (!(await verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"), config.appSecret))) return new Response("Invalid signature", { status: 401 });
  let payload: unknown;
  try { payload = JSON.parse(rawBody); } catch { return new Response("Invalid JSON", { status: 400 }); }
  for (const message of parseIncomingText(payload)) {
    const work = handleOwnerMessage(message, { config, env }).catch((error) => console.error("TALA WhatsApp message failed", error));
    if (ctx.waitUntil) ctx.waitUntil(work); else await work;
  }
  return new Response("EVENT_RECEIVED", { status: 200 });
}

async function handleOwnerNotify(request: Request, env: Record<string, unknown>): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const expected = typeof env.TALA_INTERNAL_SECRET === "string" ? env.TALA_INTERNAL_SECRET : "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || supplied !== expected) return new Response("Unauthorized", { status: 401 });
  let body: { text?: unknown };
  try { body = await request.json() as { text?: unknown }; } catch { return new Response("Invalid JSON", { status: 400 }); }
  if (typeof body.text !== "string" || !body.text.trim()) return new Response("text is required", { status: 400 });
  const config = getWhatsAppConfig(env);
  const result = await sendOwnerUpdate(config, body.text.trim());
  return Response.json({ ok: true, result });
}

function handleTalaHealth(env: Record<string, unknown>): Response {
  const required = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_OWNER_NUMBER"];
  const missing = required.filter((key) => typeof env[key] !== "string" || !(env[key] as string).trim());
  return Response.json({ ok: missing.length === 0, channel: "whatsapp", missing, modelProvider: typeof env.OPENROUTER_API_KEY === "string" && env.OPENROUTER_API_KEY ? "openrouter" : "local-commands-only" }, { status: missing.length ? 503 : 200 });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const runtimeEnv = (env ?? {}) as Record<string, unknown>;
      const url = new URL(request.url);
      if (url.pathname === "/api/tala/whatsapp/webhook") return await handleWhatsAppWebhook(request, runtimeEnv, (ctx ?? {}) as ExecutionContextLike);
      if (url.pathname === "/api/tala/whatsapp/notify") return await handleOwnerNotify(request, runtimeEnv);
      if (url.pathname === "/api/tala/health") return handleTalaHealth(runtimeEnv);
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
