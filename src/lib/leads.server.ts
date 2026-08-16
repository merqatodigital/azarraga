// ── Azarraga Glass & Aluminum — Lead Operations Server ────────────────────
//
// Server-side CRUD, scoring, activities, stage management, and conversion
// for the leads table. Backed by Supabase service-role client.
//
// All scores are computed by deterministic scoreLead() from lead-knowledge.ts.
// The LLM never invents or adjusts lead scores.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  LeadRow,
  LeadActivity,
  scoreLead,
  LeadSignalKey,
  CustomerTypeKey,
} from "@/lib/lead-knowledge";

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

async function nextLeadRef(): Promise<string> {
  const { count } = await supabaseAdmin
    .from("leads")
    .select(count('"id"'), { count: "exact" })
    .like("lead_reference", "L-%")
    .maybeSingle();
  const n = count ? parseInt(count.lead_reference?.split("-")?.pop() ?? "0", 10) : 0;
  return `L-${new Date().getFullYear()}-${String(n + 1).padStart(3, "0")}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// CREATE / READ / LIST / UPDATE / DELETE
// ──────────────────────────────────────────────────────────────────────────────

export const createLead = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      source: z.string().min(1).max(50).default("website"),
      source_url: z.string().max(500).optional(),
      customer_type: z.enum([
        "general_contractor",
        "developer",
        "resort",
        "hotel",
        "architect",
        "engineer",
        "commercial_construction",
        "residential_construction",
      ]),
      company_name: z.string().max(255).optional(),
      contact_name: z.string().min(1).max(255),
      contact_role: z.string().max(100).optional(),
      phone: z.string().max(100).optional(),
      email: z.string().max(255).optional(),
      project_name: z.string().max(500).optional(),
      project_description: z.string().max(2000).optional(),
      project_location: z.string().max(500).optional(),
      estimated_start_date: z.string().optional(),
      estimated_completion_date: z.string().optional(),
      budget_range: z.string().max(200).optional(),
      project_type: z.string().max(100).optional(),
      signals: z.array(z.string()).optional(),
      notes: z.string().max(5000).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const ref = await nextLeadRef();
    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .insert({
        lead_reference: ref,
        source: data.source,
        source_url: data.source_url ?? null,
        customer_type: data.customer_type,
        customer_type_label: data.customer_type,
        company_name: data.company_name ?? null,
        contact_name: data.contact_name,
        contact_role: data.contact_role ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        project_name: data.project_name ?? null,
        project_description: data.project_description ?? null,
        project_location: data.project_location ?? null,
        estimated_start_date: data.estimated_start_date ?? null,
        estimated_completion_date: data.estimated_completion_date ?? null,
        budget_range: data.budget_range ?? null,
        project_type: data.project_type ?? null,
        signals: data.signals ?? null,
        stage: "new",
        score: 0,
        notes: data.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Auto-score on creation
    const signals = (lead.signals ?? []) as LeadSignalKey[];
    const customerType = lead.customer_type as CustomerTypeKey;
    const newScore = scoreLead(
      signals,
      customerType,
      lead.project_location ?? "",
      !!lead.budget_range,
      !!lead.estimated_start_date,
      !!lead.project_description,
    );

    await supabaseAdmin
      .from("leads")
      .update({ score: newScore, updated_at: new Date().toISOString() })
      .eq("id", lead.id);

    return { ...lead, score: newScore } as LeadRow;
  });

export const getLead = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return lead as LeadRow;
  });

export const listLeads = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({
      source: z.string().max(50).optional(),
      customer_type: z.string().max(50).optional(),
      location: z.string().max(500).optional(),
      stage: z.string().max(50).optional(),
      search: z.string().max(200).optional(),
      sort_by_score: z.boolean().optional(),
    }).optional()
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin.from("leads").select("*").order("created_at", { ascending: false });

    if (data?.source) q = q.eq("source", data.source);
    if (data?.customer_type) q = q.eq("customer_type", data.customer_type);
    if (data?.stage) q = q.eq("stage", data.stage);
    if (data?.location) q = q.ilike("project_location", `%${data.location}%`);
    if (data?.search) {
      q = q.or(
        `contact_name.ilike.%${data.search}%,email.ilike.%${data.search}%,project_name.ilike.%${data.search}%,company_name.ilike.%${data.search}%`
      );
    }
    if (data?.sort_by_score) q = q.order("score", { ascending: false });

    const { data: leads, error } = await q;
    if (error) throw new Error(error.message);
    return (leads ?? []) as LeadRow[];
  });

export const updateLead = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      source: z.string().max(50).optional(),
      source_url: z.string().max(500).optional(),
      customer_type: z.string().max(50).optional(),
      company_name: z.string().max(255).optional(),
      contact_name: z.string().max(255).optional(),
      contact_role: z.string().max(100).optional(),
      phone: z.string().max(100).optional(),
      email: z.string().max(255).optional(),
      project_name: z.string().max(500).optional(),
      project_description: z.string().max(2000).optional(),
      project_location: z.string().max(500).optional(),
      estimated_start_date: z.string().optional(),
      estimated_completion_date: z.string().optional(),
      budget_range: z.string().max(200).optional(),
      project_type: z.string().max(100).optional(),
      signals: z.array(z.string()).optional(),
      notes: z.string().max(5000).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const set: Record<string, unknown> = {};
    for (const k of Object.keys(data) as (keyof typeof data)[]) {
      if (k !== "id" && data[k] !== undefined) set[k] = data[k];
    }
    set.updated_at = new Date().toISOString();
    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .update(set)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return lead as LeadRow;
  });

export const deleteLead = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// SCORING (re-score, deterministic)
// ──────────────────────────────────────────────────────────────────────────────

export const scoreLead = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select(
        "signals, customer_type, project_location, budget_range, estimated_start_date, project_description"
      )
      .eq("id", data.id)
      .single();

    if (!lead) throw new Error("Lead not found");

    const signals = (lead.signals ?? []) as LeadSignalKey[];
    const customerType = (lead.customer_type ?? "general_contractor") as CustomerTypeKey;
    const newScore = scoreLead(
      signals,
      customerType,
      lead.project_location ?? "",
      !!lead.budget_range,
      !!lead.estimated_start_date,
      !!lead.project_description,
    );

    await supabaseAdmin
      .from("leads")
      .update({ score: newScore, updated_at: new Date().toISOString() })
      .eq("id", data.id);

    return { id: data.id, score: newScore };
  });

// ──────────────────────────────────────────────────────────────────────────────
// ACTIVITIES
// ──────────────────────────────────────────────────────────────────────────────

export const addLeadActivity = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      lead_id: z.string().uuid(),
      type: z.string().max(50).optional(),
      description: z.string().min(1).max(2000),
      by: z.string().max(200).default("TALA"),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const actType = data.type ?? "note";
    const { data: activity, error } = await supabaseAdmin
      .from("lead_activities")
      .insert({
        lead_id: data.lead_id,
        type: actType,
        description: data.description,
        by: data.by,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("leads")
      .update({
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.lead_id);

    return activity as LeadActivity;
  });

export const listLeadActivities = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({
      lead_id: z.string().uuid(),
    }).optional()
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("lead_activities")
      .select("*")
      .order("occurred_at", { ascending: false });

    if (data?.lead_id) q = q.eq("lead_id", data.lead_id);

    const { data: activities, error } = await q;
    if (error) throw new Error(error.message);
    return (activities ?? []) as LeadActivity[];
  });

// ──────────────────────────────────────────────────────────────────────────────
// STAGE MANAGEMENT
// ──────────────────────────────────────────────────────────────────────────────

export const changeLeadStage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      stage: z.enum([
        "new",
        "contacted",
        "qualified",
        "proposing",
        "negotiating",
        "converted",
        "lost",
        "stalled",
      ]),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("leads")
      .update({
        stage: data.stage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// CONVERSION (lead → customer/project)
// ──────────────────────────────────────────────────────────────────────────────

export const convertLeadToCustomerProject = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      lead_id: z.string().uuid(),
      customer_id: z.string().uuid(),
      customer_name: z.string().min(1).max(255),
      project_id: z.string().uuid().optional(),
      project_name: z.string().max(500).optional(),
      notes: z.string().max(5000).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: conv, error } = await supabaseAdmin
      .from("quote_conversions")
      .insert({
        lead_id: data.lead_id,
        converted_at: new Date().toISOString(),
        converted_by: "owner",
        customer_id: data.customer_id,
        customer_name: data.customer_name,
        project_id: data.project_id,
        project_name: data.project_name,
        notes: data.notes,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("leads")
      .update({
        stage: "converted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.lead_id);

    await supabaseAdmin.from("lead_activities").insert({
      lead_id: data.lead_id,
      type: "converted",
      description: `Converted to customer: ${data.customer_name}`,
      by: "owner",
    });

    return conv as {
      id: string;
      lead_id: string;
      converted_at: string;
      converted_by: string;
      customer_id: string;
      customer_name: string;
      project_id: string | null;
      project_name: string | null;
      notes: string | null;
    };
  });
