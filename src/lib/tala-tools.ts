import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { toCents, fromCents, formatCents, sumCents, computeBalance } from "@/lib/operations";
import type {
  CustomerRow, ProjectRow, ClientPORow, POLineItemRow,
  InvoiceRow, InvoiceLineItemRow, PaymentRow, SupplierRow,
  SupplierPORow, ProjectCostRow,
} from "@/lib/operations";

// ──────────────────────────────────────────────────────────────────────────────
// TOOL CONTRACTS — TALA's clean business operations facade
//
// These are the only functions TALA calls to interact with Azarraga's business.
// TALA does NOT query Supabase directly. TALA does NOT compute financial values.
// Every value returned is deterministic, from the database.
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
// READ-ONLY: CUSTOMERS & PROJECTS
// ──────────────────────────────────────────────────────────────────────────────

export const talaListCustomers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("id, name, contact_name, phone, email, city, lead_source, created_at")
    .order("name");
  if (error) throw new Error(error.message);
  return data as CustomerRow[];
});

export const talaGetCustomer = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: customer, error } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return customer as CustomerRow;
  });

export const talaListProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as ProjectRow[];
});

export const talaGetProject = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select("*, customer:customers(id, name)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return project as ProjectRow & { customer?: CustomerRow };
  });

// ──────────────────────────────────────────────────────────────────────────────
// READ-ONLY: INVOICES (financial data — returned as-is from DB)
// ──────────────────────────────────────────────────────────────────────────────

export const talaListInvoices = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({
      customer_id: z.string().uuid().optional(),
      project_id: z.string().uuid().optional(),
      status: z.string().optional(),
    }).optional()
  )
  .handler(async ({ data }) => {
    const query = supabaseAdmin
      .from("invoices")
      .select("*, customer:customers(id, name), project:projects(id, name, customer:customers(id, name))")
      .order("issue_date", { ascending: false });

    if (data?.customer_id) query.eq("customer_id", data.customer_id);
    if (data?.project_id) query.eq("project_id", data.project_id);
    if (data?.status) query.eq("status", data.status);

    const { data: invoices, error } = await query;
    if (error) throw new Error(error.message);
    return invoices as (InvoiceRow & {
      customer?: CustomerRow;
      project?: (ProjectRow & { customer?: CustomerRow }) | null;
    })[];
  });

export const talaGetInvoice = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .select("*, customer:customers(id, name)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    // Compute balance deterministically — NEVER from LLM
    const balance = computeBalance(invoice.total_cents, invoice.amount_paid_cents);
    return { ...invoice, balance_cents: balance };
  });

export const talaListReceivables = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select("*, customer:customers(id, name)")
    .not("status", "eq", "cancelled")
    .not("status", "eq", "paid")
    .order("due_date");

  if (error) throw new Error(error.message);

  const receivables = (data ?? []).map((inv) => ({
    ...inv,
    balance_cents: computeBalance(inv.total_cents, inv.amount_paid_cents),
  }));

  return receivables as (InvoiceRow & { customer?: CustomerRow; balance_cents: number })[];
});

export const talaListOverdueInvoices = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select("*, customer:customers(id, name)")
    .eq("status", "overdue")
    .or(`due_date.lt.${today}`)
    .order("due_date");

  if (error) throw new Error(error.message);

  const overdue = (data ?? []).map((inv) => ({
    ...inv,
    balance_cents: computeBalance(inv.total_cents, inv.amount_paid_cents),
  }));

  return overdue as (InvoiceRow & { customer?: CustomerRow; balance_cents: number })[];
});

export const talaListCollectionsDueToday = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select("*, customer:customers(id, name)")
    .eq("due_date", today)
    .not("status", "eq", "paid")
    .not("status", "eq", "cancelled")
    .order("due_date");

  if (error) throw new Error(error.message);

  const due = (data ?? []).map((inv) => ({
    ...inv,
    balance_cents: computeBalance(inv.total_cents, inv.amount_paid_cents),
  }));

  return due as (InvoiceRow & { customer?: CustomerRow; balance_cents: number })[];
});

// ──────────────────────────────────────────────────────────────────────────────
// READ-ONLY: PAYMENTS
// ──────────────────────────────────────────────────────────────────────────────

export const talaListPayments = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ invoice_id: z.string().uuid().optional() }).optional()
  )
  .handler(async ({ data }) => {
    const query = supabaseAdmin
      .from("payments")
      .select("*, invoice:invoices(id, invoice_number, customer:customers(id, name))")
      .order("payment_date", { ascending: false });

    if (data?.invoice_id) query.eq("invoice_id", data.invoice_id);

    const { data: payments, error } = await query;
    if (error) throw new Error(error.message);
    return payments as (PaymentRow & { invoice?: InvoiceRow & { customer?: CustomerRow } })[];
  });

export const talaGetPayment = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("*, invoice:invoices(id, invoice_number, customer:customers(id, name))")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return payment as PaymentRow & { invoice?: InvoiceRow & { customer?: CustomerRow } };
  });

// ──────────────────────────────────────────────────────────────────────────────
// READ-ONLY: PROJECT FINANCIAL SUMMARY (computed from DB, deterministic)
// ──────────────────────────────────────────────────────────────────────────────

export const talaGetProjectFinancials = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    // Get project
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", data.id)
      .single();

    if (error) throw new Error(error.message);

    // Invoices for this project
    const { data: invoices } = await supabaseAdmin
      .from("invoices")
      .select("total_cents, amount_paid_cents, status")
      .eq("project_id", data.id)
      .not("status", "eq", "cancelled");

    // Payments for these invoices
    const invoiceIds = (invoices ?? []).map((inv) => inv.id);
    const { data: payments } = await supabaseAdmin
      .from("payments")
      .select("amount_cents, confirmed")
      .in("invoice_id", invoiceIds)
      .eq("confirmed", true);

    // Costs for this project
    const { data: costs } = await supabaseAdmin
      .from("project_costs")
      .select("cost_category, amount_cents, is_commitment, confirmed")
      .eq("project_id", data.id);

    // Client POs for this project
    const { data: pos } = await supabaseAdmin
      .from("client_po")
      .select("po_number, total_cents")
      .eq("project_id", data.id);

    const totalInvoiced = (invoices ?? []).reduce((s, inv) => s + inv.total_cents, 0);
    const totalPaid = (payments ?? []).reduce((s, p) => s + p.amount_cents, 0);
    const totalCostsCommitted = (costs ?? [])
      .filter((c) => c.is_commitment)
      .reduce((s, c) => s + c.amount_cents, 0);
    const totalCostsActual = (costs ?? [])
      .filter((c) => c.confirmed)
      .reduce((s, c) => s + c.amount_cents, 0);
    const poValue = (pos ?? []).reduce((s, po) => s + po.total_cents, 0);

    return {
      project_id: project.id,
      project_name: project.name,
      stage: project.stage,
      po_value_cents: poValue,
      total_invoiced_cents: totalInvoiced,
      total_collected_cents: totalPaid,
      outstanding_receivable_cents: computeBalance(totalInvoiced, totalPaid),
      committed_procurement_cents: totalCostsCommitted,
      actual_costs_cents: totalCostsActual,
      projected_profit_cents: totalInvoiced - totalCostsCommitted,
      actual_profit_cents: totalInvoiced - totalCostsActual,
      margin_percentage_projected:
        totalInvoiced > 0
          ? Math.round(((totalInvoiced - totalCostsCommitted) / totalInvoiced) * 10000) / 100
          : 0,
      margin_percentage_actual:
        totalInvoiced > 0
          ? Math.round(((totalInvoiced - totalCostsActual) / totalInvoiced) * 10000) / 100
          : 0,
    };
  });

// ──────────────────────────────────────────────────────────────────────────────
// READ-ONLY: SUPPLIERS & PROCUREMENT
// ──────────────────────────────────────────────────────────────────────────────

export const talaListSuppliers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data as SupplierRow[];
});

export const talaListSupplierPOs = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({
      supplier_id: z.string().uuid().optional(),
      status: z.string().optional(),
    }).optional()
  )
  .handler(async ({ data }) => {
    const query = supabaseAdmin
      .from("supplier_po")
      .select("*, supplier:suppliers(id, name)")
      .order("po_date", { ascending: false });

    if (data?.supplier_id) query.eq("supplier_id", data.supplier_id);
    if (data?.status) query.eq("status", data.status);

    const { data: pos, error } = await query;
    if (error) throw new Error(error.message);
    return pos as (SupplierPORow & { supplier?: SupplierRow })[];
  });

// ──────────────────────────────────────────────────────────────────────────────
// READ-ONLY: PROJECTS IN SPECIFIC STAGES (for operational alerts)
// ──────────────────────────────────────────────────────────────────────────────

export const talaListProjectsReadyToBill = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*, customer:customers(id, name)")
    .in("stage", ["delivery-installation", "billing-collection"])
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as (ProjectRow & { customer?: CustomerRow })[];
});

// ──────────────────────────────────────────────────────────────────────────────
// ALERTS — what TALA surfaces to the owner
// ──────────────────────────────────────────────────────────────────────────────

export interface TalaAlerts {
  overdue_invoices: (InvoiceRow & { customer?: CustomerRow; balance_cents: number })[];
  collections_due_today: (InvoiceRow & { customer?: CustomerRow; balance_cents: number })[];
  projects_ready_to_bill: (ProjectRow & { customer?: CustomerRow })[];
  outstanding_receivables_total_cents: number;
  receivables_count: number;
  active_projects_count: number;
  supplier_delays?: string[]; // future: supplier POs not delivered/paid timely
  unassigned_project_costs?: string[]; // future: costs with no category
  projects_requiring_billing: number;
}

export const talaGetAlerts = createServerFn({ method: "GET" }).handler(async () => {
  const overdue = await talaListOverdueInvoices();
  const dueToday = await talaListCollectionsDueToday();
  const ready = await talaListProjectsReadyToBill();
  const receivables = await talaListReceivables();
  const allProjects = await talaListProjects();

  const outstandingTotal = receivables.reduce(
    (s, inv) => s + (inv.balance_cents ?? computeBalance(inv.total_cents, inv.amount_paid_cents)),
    0
  );

  const activeCount = (allProjects ?? []).filter(
    (p) => p.stage !== "completed" && p.stage !== "prospect"
  ).length;

  return {
    overdue_invoices: overdue as TalaAlerts["overdue_invoices"],
    collections_due_today: dueToday as TalaAlerts["collections_due_today"],
    projects_ready_to_bill: ready as TalaAlerts["projects_ready_to_bill"],
    outstanding_receivables_total_cents: outstandingTotal,
    receivables_count: receivables.length,
    active_projects_count: activeCount,
    projects_requiring_billing: ready.length,
    supplier_delays: [],
    unassigned_project_costs: [],
  };
});

// ──────────────────────────────────────────────────────────────────────────────
// CRUNCH: Deterministic financial helper functions TALA can call
// ──────────────────────────────────────────────────────────────────────────────

export const talaComputeInvoiceBalance = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      total_cents: z.number().int(),
      paid_cents: z.number().int(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    // Pure computation — no DB access needed
    const balance = computeBalance(data.total_cents, data.paid_cents);
    return { balance_cents: balance };
  });

export const talaComputeProjectMargin = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      total_invoiced_cents: z.number().int(),
      committed_costs_cents: z.number().int(),
      actual_costs_cents: z.number().int(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const projectedProfit = data.total_invoiced_cents - data.committed_costs_cents;
    const actualProfit = data.total_invoiced_cents - data.actual_costs_cents;
    const projectedMargin =
      data.total_invoiced_cents > 0
        ? Math.round((projectedProfit / data.total_invoiced_cents) * 10000) / 100
        : 0;
    const actualMargin =
      data.total_invoiced_cents > 0
        ? Math.round((actualProfit / data.total_invoiced_cents) * 10000) / 100
        : 0;

    return {
      projected_profit_cents: projectedProfit,
      actual_profit_cents: actualProfit,
      margin_percentage_projected: projectedMargin,
      margin_percentage_actual: actualMargin,
    };
  });

// ──────────────────────────────────────────────────────────────────────────────
// WRITE OPERATIONS — TALA can propose, owner must approve
// ──────────────────────────────────────────────────────────────────────────────

// TALA can prepare drafts. Owner approves. (Phase 3 does not yet implement approval gate.)
// For now, these are marked clearly in the contract. Phase 4 will add approval workflow.

export const talaPrepareInvoiceDraft = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      customer_id: z.string().uuid(),
      project_id: z.string().uuid(),
      client_po_id: z.string().uuid().optional(),
      due_date: z.string().optional(),
      billing_milestone: z.string().max(100).optional(),
      line_items: z.array(
        z.object({
          description: z.string().min(1).max(1000),
          product_type: z.string().max(100).optional(),
          glass_type: z.string().max(100).optional(),
          glass_thickness_mm: z.number().int().min(0).optional(),
          aluminum_system: z.string().max(100).optional(),
          quantity: z.number().int().min(1).default(1),
          unit: z.string().max(20).default("pcs"),
          unit_price_cents: z.number().int().min(0).default(0),
          discount_cents: z.number().int().min(0).default(0),
          tax_cents: z.number().int().min(0).default(0),
          line_total_cents: z.number().int(),
          remarks: z.string().max(1000).optional(),
        })
      ),
      subtotal_cents: z.number().int(),
      discount_cents: z.number().int().min(0).default(0),
      tax_cents: z.number().int().min(0).default(0),
      total_cents: z.number().int(),
      notes: z.string().max(5000).optional(),
      payment_terms: z.string().max(200).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    // Validate money consistency (deterministic check)
    const expectedTotal =
      data.subtotal_cents - data.discount_cents + data.tax_cents;
    if (expectedTotal !== data.total_cents) {
      throw new Error(
        `Money mismatch: subtotal(${data.subtotal_cents}) - discount(${data.discount_cents}) + tax(${data.tax_cents}) = ${expectedTotal}, but total_cents = ${data.total_cents}`
      );
    }

    // Create as draft — owner must change to "issued"
    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .insert({
        invoice_number: `AZ-${Date.now()}`, // placeholder — real number from DB sequence once SQL is installed
        customer_id: data.customer_id,
        project_id: data.project_id,
        client_po_id: data.client_po_id,
        due_date: data.due_date,
        billing_milestone: data.billing_milestone,
        subtotal_cents: data.subtotal_cents,
        discount_cents: data.discount_cents,
        tax_cents: data.tax_cents,
        total_cents: data.total_cents,
        amount_paid_cents: 0,
        notes: data.notes,
        payment_terms: data.payment_terms,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Insert line items
    if (data.line_items.length > 0) {
      const lineItems = data.line_items.map((item, idx) => ({
        invoice_id: invoice.id,
        sort_order: idx,
        description: item.description,
        product_type: item.product_type,
        glass_type: item.glass_type,
        glass_thickness_mm: item.glass_thickness_mm,
        aluminum_system: item.aluminum_system,
        quantity: item.quantity,
        unit: item.unit,
        unit_price_cents: toCents(item.unit_price_cents / 100),
        discount_cents: toCents(item.discount_cents / 100),
        tax_cents: toCents(item.tax_cents / 100),
        line_total_cents: toCents(item.line_total_cents / 100),
        remarks: item.remarks,
      }));

      const { error: liError } = await supabaseAdmin
        .from("invoice_line_items")
        .insert(lineItems);
      if (liError) throw new Error(liError.message);
    }

    return { invoice_id: invoice.id, status: "draft", message: "Invoice draft prepared. Owner approval required before issuing." };
  });
