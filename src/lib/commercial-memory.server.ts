// ── Azarraga Glass & Aluminum — Commercial Memory ────────────────────────────
//
// Evidence-backed retrieval across the system. Agent queries such as:
//
//   "Show Tara Hostel purchases."
//   "Show previous 900 Series jobs."
//   "What did this customer previously buy?"
//   "Show 10mm tempered clear jobs."
//   "Find similar historical specifications."
//   "Show previous jobs with delivery and installation."
//
// Every returned value retains provenance to its source document.
// NEVER fabricates or infers values.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ──────────────────────────────────────────────────────────────────────────────
// SEARCH COMMERCIAL MEMORY
// ──────────────────────────────────────────────────────────────────────────────

export const searchCommercialMemory = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        customer_name: z.string().max(255).optional(),
        customer_id: z.string().uuid().optional(),
        project_name: z.string().max(255).optional(),
        project_id: z.string().uuid().optional(),
        po_number: z.string().max(100).optional(),
        lead_reference: z.string().max(50).optional(),
        product_type: z.string().max(100).optional(),
        glass_type: z.string().max(100).optional(),
        glass_thickness_mm: z.number().int().positive().optional(),
        aluminum_system: z.string().max(100).optional(),
        include_documents: z.boolean().default(true),
        include_items: z.boolean().default(true),
        include_quotes: z.boolean().default(true),
        include_client_po: z.boolean().default(true),
        limit: z.number().int().min(1).max(200).default(50),
      })
      .refine(
        (d) =>
          d.customer_name ||
          d.customer_id ||
          d.project_name ||
          d.project_id ||
          d.po_number ||
          d.lead_reference ||
          d.product_type ||
          d.glass_type ||
          d.glass_thickness_mm,
        "Provide at least one search parameter"
      )
      .parse(input)
  )
  .handler(async ({ data }) => {
    const results: any = {
      customers: [],
      projects: [],
      client_po: [],
      items_purchased: [],
      client_docs: [],
      quotes: [],
      evidence_count: 0,
      query: {
        customer_name: data.customer_name,
        product_type: data.product_type,
        glass_type: data.glass_type,
        glass_thickness_mm: data.glass_thickness_mm,
        aluminum_system: data.aluminum_system,
      },
    };

    // 1. Customers
    if (data.customer_name || data.customer_id) {
      let q = supabaseAdmin.from("customers").select("*").limit(data.limit);
      if (data.customer_name) {
        q = q.or(
          `name.ilike.%${data.customer_name}%, name.ilike.%${data.customer_name.toUpperCase()}%, name.ilike.%${data.customer_name.toLowerCase()}%`
        );
      }
      if (data.customer_id) q = q.eq("id", data.customer_id);
      const { data: customers } = await q;
      results.customers = (customers ?? []) as any[];
      results.evidence_count += results.customers.length;
    }

    // 2. Projects
    if (data.project_name || data.project_id || data.customer_id) {
      let q = supabaseAdmin
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(data.limit);
      if (data.project_name) q = q.or(`name.ilike.%${data.project_name}%`);
      if (data.project_id) q = q.eq("id", data.project_id);
      if (data.customer_id && !data.project_id) q = q.eq("customer_id", data.customer_id);
      const { data: projects } = await q;
      results.projects = (projects ?? []) as any[];
      results.evidence_count += results.projects.length;
    }

    // 3. Client POs
    if (data.po_number || data.project_id || data.customer_id) {
      let q = supabaseAdmin
        .from("client_po")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(data.limit);
      if (data.po_number) q = q.eq("po_number", data.po_number);
      if (data.project_id) q = q.eq("project_id", data.project_id);
      if (data.customer_id && !data.project_id) {
        const { data: projs } = await supabaseAdmin
          .from("projects")
          .select("id")
          .eq("customer_id", data.customer_id)
          .limit(data.limit);
        if (projs && projs.length > 0) q = q.in("project_id", projs.map((p) => p.id));
      }
      const { data: pos } = await q;
      results.client_po = (pos ?? []) as any[];
      results.evidence_count += results.client_po.length;
    }

    // 4. Items purchased (with product/specification filters)
    if (data.include_items) {
      let q = supabaseAdmin
        .from("items_purchased")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(data.limit);

      if (data.po_number) q = q.eq("po_number", data.po_number);
      if (data.lead_reference) q = q.eq("lead_reference", data.lead_reference);

      // Product/specification filters on description
      const filters: string[] = [];
      if (data.product_type) filters.push(`description.ilike.%${data.product_type}%`);
      if (data.glass_type) filters.push(`description.ilike.%${data.glass_type}%`);
      if (data.aluminum_system) filters.push(`description.ilike.%${data.aluminum_system}%`);

      if (filters.length > 0) {
        (q as any).or(filters.join(","));
      }

      const { data: items } = await q;
      results.items_purchased = (items ?? []) as any[];
      results.evidence_count += results.items_purchased.length;
    }

    // 5. Client documents
    if (data.include_documents) {
      let q = supabaseAdmin
        .from("client_docs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(data.limit);

      if (data.po_number) q = q.eq("po_number", data.po_number);
      if (data.lead_reference) q = q.eq("lead_reference", data.lead_reference);
      if (data.product_type)
        q = (q as any).or(`file_name.ilike.%${data.product_type}%`);

      const { data: docs } = await q;
      results.client_docs = (docs ?? []) as any[];
      results.evidence_count += results.client_docs.length;
    }

    return results;
  });

// ──────────────────────────────────────────────────────────────────────────────
// GET CUSTOMER HISTORY — all projects, POs, items for a customer
// ──────────────────────────────────────────────────────────────────────────────

export const getCustomerHistory = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ customer_id: z.string().uuid() }).parse(input)
  )
  .handler(async ({ data }) => {
    // Customer
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("id", data.customer_id)
      .single();

    if (!customer) return { customer: null, history: [] };

    // Projects
    const { data: projects } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("customer_id", data.customer_id)
      .order("created_at", { ascending: false });

    const history: any[] = [];

    for (const project of (projects ?? [])) {
      // Client POs for this project
      const { data: pos } = await supabaseAdmin
        .from("client_po")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });

      // Items purchased for this project
      const { data: items } = await supabaseAdmin
        .from("items_purchased")
        .select("*")
        .eq("project_name", project.name)
        .order("created_at", { ascending: false });

      history.push({
        project: project,
        client_po: pos ?? [],
        items_purchased: items ?? [],
        total_value_cents: (pos ?? []).reduce((s, p) => s + (p.total_cents || 0), 0),
      });
    }

    return {
      customer: customer as any,
      history: history,
      summary: {
        total_projects: history.length,
        total_po_value_cents: history.reduce((s, h) => s + h.total_value_cents, 0),
        total_items: history.reduce((s, h) => s + h.items_purchased.length, 0),
      },
    };
  });

// ──────────────────────────────────────────────────────────────────────────────
// GET SPECIFICATION HISTORY — find similar historical specs
// ──────────────────────────────────────────────────────────────────────────────
//
// Finds items_purchased matching a specification pattern:
//   "900 Series", "10mm tempered clear", "2.938 x 2.700"
//
// Returns items with their source document provenance.

export const getSpecificationHistory = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        // Search by specification — at least one
        product_type: z.string().max(100).optional(),
        glass_type: z.string().max(100).optional(),
        glass_thickness_mm: z.number().int().positive().optional(),
        aluminum_system: z.string().max(100).optional(),
        dimensions_w_mm: z.number().int().positive().optional(),
        dimensions_h_mm: z.number().int().positive().optional(),
        // Narrow by customer/project
        customer_id: z.string().uuid().optional(),
        project_id: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(200).default(50),
      })
      .refine(
        (d) =>
          d.product_type ||
          d.glass_type ||
          d.glass_thickness_mm ||
          d.aluminum_system ||
          d.dimensions_w_mm ||
          d.dimensions_h_mm,
        "Provide at least one specification parameter"
      )
      .parse(input)
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("items_purchased")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    const filters: string[] = [];
    if (data.product_type) filters.push(`description.ilike.%${data.product_type}%`);
    if (data.glass_type) filters.push(`description.ilike.%${data.glass_type}%`);
    if (data.aluminum_system) filters.push(`description.ilike.%${data.aluminum_system}%`);

    // Dimensions are stored in description text — search for pattern
    if (data.dimensions_w_mm) {
      const pattern = `${data.dimensions_w_mm}`;
      filters.push(`description.ilike.%${pattern}%`);
    }
    if (data.dimensions_h_mm) {
      const pattern = `${data.dimensions_h_mm}`;
      filters.push(`description.ilike.%${pattern}%`);
    }

    if (filters.length > 0) (q as any).or(filters.join(","));
    if (data.customer_id) {
      // Narrow: find items for this customer's projects
      const { data: projects } = await supabaseAdmin
        .from("projects")
        .select("name")
        .eq("customer_id", data.customer_id)
        .limit(50);
      if (projects && projects.length > 0) {
        const names = projects.map((p) => p.name);
        (q as any).or(names.map((n) => `project_name.eq.${n}`).join(","));
      }
    }

    const { data: items } = await q;
    return {
      specifications: (items ?? []) as any[],
      count: (items ?? []).length,
      note: "Values are exact from source documents. Do not infer or modify.",
    };
  });

// ──────────────────────────────────────────────────────────────────────────────
// GET PO WITH FULL PROVENANCE
// ──────────────────────────────────────────────────────────────────────────────

export const getPOWithProvenance = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        po_number: z.string().min(1).max(100),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const poNumber = data.po_number.replace(/[^a-zA-Z0-9\-_.]/g, "_");

    // PO record
    const { data: po } = await supabaseAdmin
      .from("client_po")
      .select(`*`)
      .eq("po_number", poNumber)
      .maybeSingle();

    if (!po) return { po: null, provenance: null };

    // Documents linked to this PO
    const { data: docs } = await supabaseAdmin
      .from("client_docs")
      .select("*")
      .eq("po_number", poNumber)
      .order("created_at", { ascending: false });

    // Items purchased
    const { data: items } = await supabaseAdmin
      .from("items_purchased")
      .select("*")
      .eq("po_number", poNumber)
      .order("created_at", { ascending: false });

    // Project + customer
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("*, customer:customers(*)")
      .eq("id", po.project_id)
      .maybeSingle();

    return {
      po: po as any,
      documents: (docs ?? []) as any[],
      items: (items ?? []) as any[],
      project: project as any,
      provenance: {
        po_number: poNumber,
        source_document: docs?.[0]?.file_name ?? null,
        source_url: docs?.[0]?.file_url ?? null,
        client_doc_id: docs?.[0]?.id ?? null,
        items_count: (items ?? []).length,
        total_cents: po.total_cents,
      },
    };
  });
