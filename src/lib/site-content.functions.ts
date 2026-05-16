import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SITE_ID = "main";
const BUCKET = "site-media";

export const getSiteContent = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("site_content")
      .select("data, updated_at")
      .eq("id", SITE_ID)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { data: (data?.data as unknown) ?? null, updatedAt: data?.updated_at ?? null };
  },
);

function assertPasskey(passkey: string) {
  const expected = process.env.ADMIN_PASSKEY;
  if (!expected) throw new Error("ADMIN_PASSKEY not configured");
  if (passkey !== expected) throw new Error("Unauthorized");
}

export const saveSiteContent = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        passkey: z.string().min(1).max(128),
        data: z.record(z.string(), z.unknown()),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertPasskey(data.passkey);
    const { error } = await supabaseAdmin
      .from("site_content")
      .upsert({ id: SITE_ID, data: data.data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadSiteMedia = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        passkey: z.string().min(1).max(128),
        fileName: z.string().min(1).max(255),
        contentType: z.string().min(1).max(127),
        dataBase64: z.string().min(1).max(20_000_000), // ~15MB raw
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertPasskey(data.passkey);
    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const bytes = Buffer.from(data.dataBase64, "base64");
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    return { url: pub.publicUrl, path };
  });
