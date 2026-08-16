import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CustomerRow, ProjectRow } from "@/lib/operations";
import {
  PRODUCT_SYSTEMS,
  SPEC_FIELDS,
  validateQuoteSpecs,
  MissingSpec,
  QuoteSystemSpec,
  ProductSystemKey,
  QUOTE_STATUS,
} from "@/lib/quote-knowledge";
import type { LeadRow } from "@/lib/lead-knowledge";

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

async function nextQuoteRef(): Promise<string> {
  const { data: last } = await supabaseAdmin
    .from("quotes")
    .select("quote_reference")
    .like("quote_reference", "Q-%")
    .order("quote_reference", { ascending: false })
    .limit(1)
    .single();
  if (!last) return `Q-${new Date().getFullYear()}-001`;
  const n = parseInt(last.quote_reference.split("-").pop() ?? "0", 10);
  return `Q-${new Date().getFullYear()}-${String(n + 1).padStart(3, "0")}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// CREATE / READ / LIST / UPDATE / DELETE
// ──────────────────────────────────────────────────────────────────────────────

export const createQuote = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      customer_id: z.string().uuid(),
      project_id: z.string().uuid().optional(),
      prepared_by: z.string().max(200).default("owner"),
      notes: z.string().max(5000).optional(),
    }).parse(input)
  )
  .handler(async ({ input }) => {
    const ref = await nextQuoteRef();
    const { data: quote, error } = await supabaseAdmin
      .from("quotes")
      .insert({
        quote_reference: ref,
        customer_id: input.customer_id,
        project_id: input.project_id ?? null,
        total_cents: 0,
        prepared_by: input.prepared_by,
        status: "draft",
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return quote as {
      id: string;
      quote_reference: string;
      customer_id: string;
      project_id: string | null;
      total_cents: number;
      prepared_at: string;
      prepared_by: string;
      status: string;
      validity_days: number;
      notes: string | null;
    };
  });

export const getQuote = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ id: z.string().uuid() }).parse(input)
  )
  .handler(async ({ input }) => {
    const { data: quote, error } = await supabaseAdmin
      .from("quotes")
      .select(
        `*, customer:customers(id, name, contact_name, phone, email, city),
         project:projects(id, name, customer_id)`
      )
      .eq("id", input.id)
      .single();

    if (error) throw new Error(error.message);
    return quote as {
      id: string;
      quote_reference: string;
      customer_id: string;
      project_id: string | null;
      total_cents: number;
      prepared_at: string;
      prepared_by: string;
      status: string;
      validity_days: number;
      notes: string | null;
      created_at: string;
      updated_at: string;
      customer?: CustomerRow;
      project?: ProjectRow | null;
    };
  });

export const listQuotes = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({
      customer_id: z.string().uuid().optional(),
      project_id: z.string().uuid().optional(),
      status: z.string().max(50).optional(),
      search: z.string().max(200).optional(),
    }).optional()
  )
  .handler(async ({ input }) => {
    let q = supabaseAdmin
      .from("quotes")
      .select(
        `*, customer:customers(id, name),
         project:projects(id, name, customer_id),
         quote_systems(id, system_key, quantity, unit, glass_type, glass_thickness_mm, aluminum_system, location, configuration)`
      )
      .order("created_at", { ascending: false });

    if (input.customer_id) q = q.eq("customer_id", input.customer_id);
    if (input.project_id) q = q.eq("project_id", input.project_id);
    if (input.status) q = q.eq("status", input.status);
    if (input.search) {
      q = q.or(
        `quote_reference.ilike.%${input.search}%,customer.name.ilike.%${input.search}%`
      );
    }

    const { data: quotes, error } = await q;
    if (error) throw new Error(error.message);
    return quotes as Array<{
      id: string;
      quote_reference: string;
      customer_id: string;
      project_id: string | null;
      total_cents: number;
      prepared_at: string;
      prepared_by: string;
      status: string;
      validity_days: number;
      notes: string | null;
      created_at: string;
      updated_at: string;
      customer?: CustomerRow;
      project?: ProjectRow | null;
      quote_systems?: Array<{
        id: string;
        system_key: string;
        quantity: number;
        unit: string | null;
        glass_type: string | null;
        glass_thickness_mm: number | null;
        aluminum_system: string | null;
        location: string | null;
        configuration: string | null;
      }>;
    }>;
  });

export const updateQuote = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      notes: z.string().max(5000).optional(),
      validity_days: z.number().int().min(1).max(365).optional(),
      prepared_by: z.string().max(200).optional(),
    }).parse(input)
  )
  .handler(async ({ input }) => {
    const set: Record<string, unknown> = {};
    if (input.notes !== undefined) set.notes = input.notes;
    if (input.validity_days !== undefined) set.validity_days = input.validity_days;
    if (input.prepared_by !== undefined) set.prepared_by = input.prepared_by;
    set.updated_at = new Date().toISOString();

    const { data: quote, error } = await supabaseAdmin
      .from("quotes")
      .update(set)
      .eq("id", input.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return quote as { id: string; status: string };
  });

export const cancelQuote = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      reason: z.string().max(2000).optional(),
    }).parse(input)
  )
  .handler(async ({ input }) => {
    const set: Record<string, unknown> = { status: "draft", updated_at: new Date().toISOString() };
    if (input.reason !== undefined) set.notes = input.reason;
    const { error } = await supabaseAdmin
      .from("quotes")
      .update(set)
      .eq("id", input.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// QUOTE SYSTEMS
// ──────────────────────────────────────────────────────────────────────────────

export const addQuoteSystem = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      quote_id: z.string().uuid(),
      system_key: z.enum([
        "sliding_windows", "sliding_doors", "swing_doors", "awning_windows",
        "casement_windows", "fixed_glass", "tempered_glass", "shower_partitions",
        "bi_fold_doors", "slide_up_systems", "storefronts", "glass_railings",
        "canopies", "mullions", "screen_doors", "acp", "roll_up_doors",
        "glass_shelves_tabletops", "cabinets", "aquariums_grills",
        "local_systems", "high_end_systems",
      ]),
      quantity: z.number().int().min(1).default(1),
      width_mm: z.number().int().min(0).optional(),
      height_mm: z.number().int().min(0).optional(),
      unit: z.string().max(20).optional(),
      configuration: z.string().max(500).optional(),
      glass_type: z.string().max(100).optional(),
      glass_thickness_mm: z.number().int().min(0).optional(),
      glass_color: z.string().max(50).optional(),
      aluminum_system: z.string().max(100).optional(),
      finish: z.string().max(100).optional(),
      hardware: z.string().max(500).optional(),
      screens: z.string().max(200).optional(),
      installation: z.string().max(500).optional(),
      location: z.string().max(500).optional(),
      notes: z.string().max(2000).optional(),
    }).parse(input)
  )
  .handler(async ({ input }) => {
    const { data: system, error } = await supabaseAdmin
      .from("quote_systems")
      .insert({
        quote_id: input.quote_id,
        system_key: input.system_key,
        quantity: input.quantity,
        width_mm: input.width_mm ?? null,
        height_mm: input.height_mm ?? null,
        unit: input.unit ?? null,
        configuration: input.configuration ?? null,
        glass_type: input.glass_type ?? null,
        glass_thickness_mm: input.glass_thickness_mm ?? null,
        glass_color: input.glass_color ?? null,
        aluminum_system: input.aluminum_system ?? null,
        finish: input.finish ?? null,
        hardware: input.hardware ?? null,
        screens: input.screens ?? null,
        installation: input.installation ?? null,
        location: input.location ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return system as QuoteSystemSpec & { id: string; quote_id: string; created_at: string };
  });

export const updateQuoteSystem = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      quantity: z.number().int().min(1).optional(),
      width_mm: z.number().int().min(0).optional(),
      height_mm: z.number().int().min(0).optional(),
      unit: z.string().max(20).optional(),
      configuration: z.string().max(500).optional(),
      glass_type: z.string().max(100).optional(),
      glass_thickness_mm: z.number().int().min(0).optional(),
      glass_color: z.string().max(50).optional(),
      aluminum_system: z.string().max(100).optional(),
      finish: z.string().max(100).optional(),
      hardware: z.string().max(500).optional(),
      screens: z.string().max(200).optional(),
      installation: z.string().max(500).optional(),
      location: z.string().max(500).optional(),
      notes: z.string().max(2000).optional(),
    }).parse(input)
  )
  .handler(async ({ input }) => {
    const set: Record<string, unknown> = {};
    for (const k of Object.keys(input) as (keyof typeof input)[]) {
      if (k !== "id" && input[k] !== undefined) set[k] = input[k];
    }
    const { data: system, error } = await supabaseAdmin
      .from("quote_systems")
      .update(set)
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return system as QuoteSystemSpec & { id: string; quote_id: string };
  });

export const deleteQuoteSystem = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ id: z.string().uuid() }).parse(input)
  )
  .handler(async ({ input }) => {
    const { error } = await supabaseAdmin
      .from("quote_systems")
      .delete()
      .eq("id", input.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// VALIDATION + TOTALS
// ──────────────────────────────────────────────────────────────────────────────

export const validateQuote = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ quote_id: z.string().uuid() }).parse(input)
  )
  .handler(async ({ input }) => {
    const { data: systems } = await supabaseAdmin
      .from("quote_systems")
      .select("*")
      .eq("quote_id", input.quote_id);

    if (!systems || systems.length === 0) {
      return {
        valid: false,
        missing: [
          {
            system_key: "unknown" as ProductSystemKey,
            field: "systems" as keyof typeof SPEC_FIELDS,
            label: "Systems",
            reason: "No systems have been added to this quote yet.",
            severity: "critical",
          },
        ],
        warnings: [],
        critical_missing: [
          {
            system_key: "unknown" as ProductSystemKey,
            field: "systems" as keyof typeof SPEC_FIELDS,
            label: "Systems",
            reason: "No systems have been added to this quote yet.",
            severity: "critical",
          },
        ],
      };
    }

    const allMissing: MissingSpec[] = [];
    const allWarnings: string[] = [];

    for (const sys of systems) {
      const result = validateQuoteSpecs(
        sys.system_key as ProductSystemKey,
        sys as unknown as Record<string, unknown>,
      );
      allMissing.push(...result.missing);
      allWarnings.push(...result.warnings);
    }

    const critical = allMissing.filter((m) => m.severity === "critical");

    return {
      valid: critical.length === 0,
      missing: allMissing,
      warnings: allWarnings,
      critical_missing: critical,
      system_count: systems.length,
    };
  });

export const calculateQuoteTotals = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ quote_id: z.string().uuid() }).parse(input)
  )
  .handler(async ({ input }) => {
    const { data: systems } = await supabaseAdmin
      .from("quote_systems")
      .select("quantity, unit")
      .eq("quote_id", input.quote_id);

    const totalQuantity = systems?.reduce((s, sys) => s + (sys.quantity ?? 0), 0) ?? 0;
    const unitTypes = new Set(systems?.map((s) => s.unit).filter(Boolean) ?? []);

    return {
      system_count: systems?.length ?? 0,
      total_quantity: totalQuantity,
      distinct_units: unitTypes.size,
      note:
        "Financial totals require owner pricing input. The quote admin UI collects unit prices, discounts, and taxes.",
    };
  });

// ──────────────────────────────────────────────────────────────────────────────
// APPROVAL WORKFLOW
// ──────────────────────────────────────────────────────────────────────────────

export const submitQuoteForApproval = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      prepared_by: z.string().max(200).optional(),
    }).parse(input)
  )
  .handler(async ({ input }) => {
    const { data: quote, error } = await supabaseAdmin
      .from("quotes")
      .update({
        status: "ready-for-approval",
        prepared_by: input.prepared_by ?? "owner",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return quote as { id: string; quote_reference: string; status: string };
  });

export const approveQuote = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      approved_by: z.string().max(200),
    }).parse(input)
  )
  .handler(async ({ input }) => {
    const { data: quote, error } = await supabaseAdmin
      .from("quotes")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return quote as { id: string; quote_reference: string; status: string };
  });

export const rejectQuote = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      reason: z.string().max(2000),
    }).parse(input)
  )
  .handler(async ({ input }) => {
    const set: Record<string, unknown> = {
      status: "draft",
      notes: input.reason,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin
      .from("quotes")
      .update(set)
      .eq("id", input.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// CONVERSION
// ──────────────────────────────────────────────────────────────────────────────

export const convertQuoteToProject = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      quote_id: z.string().uuid(),
      project_id: z.string().uuid(),
    }).parse(input)
  )
  .handler(async ({ input }) => {
    const { error } = await supabaseAdmin
      .from("quotes")
      .update({
        status: "converted-to-p_o",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.quote_id);

    if (error) throw new Error(error.message);
    return { ok: true, quote_id: input.quote_id, project_id: input.project_id };
  });
