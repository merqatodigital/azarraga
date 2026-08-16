import { type QuoteValidationResult, type ProductSystemKey, type MissingSpec, validateQuoteSpecs } from "@/lib/quote-knowledge";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const talaListQuotes = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ status: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    let q = supabaseAdmin.from("quotes").select("*").order("created_at", { ascending: false });
    if (data?.status) q = q.eq("status", data.status);
    const { data: quotes, error } = await q;
    if (error) throw new Error(error.message);
    return quotes as unknown[];
  });
