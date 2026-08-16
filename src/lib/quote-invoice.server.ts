// ── Azarraga Glass & Aluminum — Quote & Invoice Carry-Forward ────────────────
//
// Connects the quote workflow to the invoice workflow:
//
//   QUOTE (from lead)
//   → APPROVED QUOTE
//   → INVOICE DRAFT (inherits customer/project/PO/products/quantities/prices/terms)
//   → HUMAN APPROVES (draft → issued)
//
// THE DETERMINISTIC ENGINE DOES ALL MONEY ARITHMETIC.
// THE HUMAN APPROVES THE COMMERCIAL DOCUMENT.
// Invoices remain DRAFT until human approval.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { toCents } from "@/lib/operations";
import type { InvoiceRow } from "@/lib/operations";
import {
  createInvoice,
  getInvoice,
  updateInvoice,
  getProject,
  getCustomer,
} from "@/lib/operations.server";
import { getQuote, approveQuote } from "@/lib/quotes.server";
import { listClientDocs, listItemsPurchased } from "@/lib/client-docs.server";

// ──────────────────────────────────────────────────────────────────────────────
// CREATE QUOTE FROM LEAD — carry forward context
// ──────────────────────────────────────────────────────────────────────────────
//
// When creating a quote from a lead, carries forward:
//   - customer (from lead.company_name or contact)
//   - project (from lead.project_name)
//   - location (from lead.project_location)
//   - contact (from lead.contact_name/phone/email)
//   - documents (from client_docs linked to lead)
//   - PO information (from client_po linked to lead's documents)
//   - known specifications (from items_purchased)
//   - historical evidence (from commercial memory)
//
// The AGENT may interpret documents and propose a takeoff.
// The deterministic engine does all money arithmetic.

export const createQuoteFromLead = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        lead_id: z.string().uuid(),
        prepared_by: z.string().max(200).optional().default("TALA"),
        // Quote systems/specs — provided by agent or human
        systems: z
          .array(
            z.object({
              system_key: z.string().min(1).max(50),
              description: z.string().max(500).optional(),
              quantity: z.number().int().min(1).default(1),
              unit_price_cents: z.number().int().min(0),
              notes: z.string().max(500).optional(),
            })
          )
          .default([]),
        notes: z.string().max(5000).optional(),
        customer_id: z.string().uuid().optional(),
        project_id: z.string().uuid().optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    // 1. Get the lead
    const leads = await listLeads({ data: {} });
    const lead = leads.find((l) => l.id === data.lead_id);
    if (!lead) throw new Error("Lead not found");

    // 2. Get lead's documents
    const docs = await listClientDocs({ data: { lead_reference: lead.lead_reference } });

    // 3. Get lead's items purchased (historical specifications)
    const items = await listItemsPurchased({ data: { lead_reference: lead.lead_reference } });

    // 4. Get PO information from documents
    const poDocs = docs.filter((d) => d.document_type === "purchase_order");

    // 5. Build carry-forward context
    const carryForward = {
      customer: {
        name: lead.company_name || lead.contact_name,
        contact_name: lead.contact_name,
        phone: lead.phone,
        email: lead.email,
        customer_type: lead.customer_type,
        lead_reference: lead.lead_reference,
      },
      project: {
        name: lead.project_name,
        location: lead.project_location,
        description: lead.project_description,
      },
      documents: docs.map((d) => ({
        id: d.id,
        type: d.document_type,
        name: d.file_name,
        url: d.file_url,
        uploaded_at: d.created_at,
      })),
      po_information: poDocs.map((d) => ({
        po_number: d.po_number,
        file_name: d.file_name,
        url: d.file_url,
      })),
      historical_specifications: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price_cents: item.unit_price_cents,
        total_cents: item.total_cents,
        project: item.project_name,
      })),
      provenance: {
        lead_reference: lead.lead_reference,
        source: lead.source,
        created_at: lead.created_at,
      },
    };

    const quote = await createQuote({
      data: {
        lead_id: data.lead_id,
        customer_id: data.customer_id,
        project_id: data.project_id,
        prepared_by: data.prepared_by,
        notes: data.notes,
        systems: data.systems,
      },
    });

    return {
      quote: quote as any,
      carry_forward: carryForward,
    };
  });

// ──────────────────────────────────────────────────────────────────────────────
// CREATE INVOICE DRAFT FROM APPROVED QUOTE
// ──────────────────────────────────────────────────────────────────────────────
//
// Invoice drafts inherit structured information from the approved quote/project
// WITHOUT making the user retype:
//   - customer
//   - address
//   - project
//   - PO number
//   - products
//   - quantities
//   - unit prices
//   - commercial terms
//
// Invoices remain DRAFT until human approval.
// The deterministic engine does all money arithmetic.

export const createInvoiceFromQuote = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        quote_id: z.string().uuid(),
        invoice_number: z.string().max(100).optional(),
        billing_milestone: z.string().max(100).optional(),
        due_date: z.string().max(10).optional(),
        notes: z.string().max(5000).optional(),
        line_items: z
          .array(
            z.object({
              sort_order: z.number().int().min(1),
              description: z.string().min(1).max(500),
              quantity: z.number().int().min(1),
              unit: z.string().max(50),
              unit_price_cents: z.number().int().min(0),
              discount_cents: z.number().int().min(0).default(0),
              tax_cents: z.number().int().min(0).default(0),
              product_type: z.string().max(100).optional(),
              glass_type: z.string().max(100).optional(),
              glass_thickness_mm: z.number().int().positive().optional(),
              aluminum_system: z.string().max(100).optional(),
            })
          )
          .optional(),
        payment_terms: z.string().max(500).optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    // 1. Get the quote
    const quote = await getQuote({ data: { id: data.quote_id } });
    if (!quote) throw new Error("Quote not found");
    if (quote.status !== "approved") {
      throw new Error("Can only create invoice from approved quote");
    }

    // 2. Get project/customer info
    let project = null;
    let customer = null;
    if (quote.project_id) {
      const proj = await getProject({ data: { id: quote.project_id } });
      project = proj as any;
      customer = (project as any)?.customer as any;
    } else if (quote.customer_id) {
      customer = await getCustomer({ data: { id: quote.customer_id } });
    }

    if (!customer) throw new Error("Quote must have project or customer to create invoice");

    // 3. Get PO number from project
    let poNumber = null;
    if (project) {
      const pos = await supabaseAdmin
        .from("client_po")
        .select("po_number")
        .eq("project_id", project.id)
        .maybeSingle();
      if (pos) poNumber = pos.po_number;
    }

    // 4. Determine line items
    const invoiceLineItems: any[] = [];

    if (data.line_items && data.line_items.length > 0) {
      for (const item of data.line_items) {
        invoiceLineItems.push({
          sort_order: item.sort_order,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price_cents: toCents(item.unit_price_cents / 100),
          discount_cents: toCents(item.discount_cents / 100),
          tax_cents: toCents(item.tax_cents / 100),
          product_type: item.product_type,
          glass_type: item.glass_type,
          glass_thickness_mm: item.glass_thickness_mm,
          aluminum_system: item.aluminum_system,
        });
      }
    } else if (quote.quote_systems && quote.quote_systems.length > 0) {
      // Inherit from quote systems (deterministic, no LLM computation)
      quote.quote_systems.forEach((sys: any, idx: number) => {
        invoiceLineItems.push({
          sort_order: idx + 1,
          description: sys.description || sys.system_key,
          quantity: sys.quantity,
          unit: sys.unit || "sets",
          unit_price_cents: toCents((sys.unit_price_cents ?? 0) / 100),
          discount_cents: toCents(0),
          tax_cents: toCents(0),
          product_type: sys.product_type,
          glass_type: sys.glass_type,
          glass_thickness_mm: sys.glass_thickness_mm,
          aluminum_system: sys.aluminum_system,
        });
      });
    }

    if (invoiceLineItems.length === 0) {
      throw new Error("No line items to invoice");
    }

    // 5. Compute totals deterministically
    const totalCents = invoiceLineItems.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unit_price_cents;
      return sum + lineTotal - item.discount_cents + item.tax_cents;
    }, 0);

    // 6. Create invoice draft
    const invoice = await createInvoice({
      data: {
        project_id: quote.project_id || undefined,
        customer_id: quote.customer_id || (project as any)?.customer_id,
        invoice_number: data.invoice_number,
        status: "draft",
        total_cents: totalCents,
        amount_paid_cents: 0,
        due_date: data.due_date,
        billing_milestone: data.billing_milestone,
        payment_terms: data.payment_terms || (poNumber ? `Per PO ${poNumber}` : undefined),
        notes: data.notes,
      },
    });

    // 7. Add line items
    for (const item of invoiceLineItems) {
      const lineTotalCents =
        item.quantity * item.unit_price_cents - item.discount_cents + item.tax_cents;
      await supabaseAdmin
        .from("invoice_line_items")
        .insert({
          invoice_id: invoice.id,
          sort_order: item.sort_order,
          description: item.description,
          product_type: item.product_type,
          glass_type: item.glass_type,
          glass_thickness_mm: item.glass_thickness_mm,
          aluminum_system: item.aluminum_system,
          quantity: item.quantity,
          unit: item.unit,
          unit_price_cents: item.unit_price_cents,
          discount_cents: item.discount_cents,
          tax_cents: item.tax_cents,
          line_total_cents: lineTotalCents,
        })
        .catch(() => {});
    }

    const fullInvoice = await getInvoice({ data: { id: invoice.id } });

    return {
      invoice: fullInvoice as InvoiceRow,
      inherited_from: {
        quote_id: data.quote_id,
        customer: customer,
        project: project,
        po_number: poNumber,
        line_items_source: data.line_items ? "provided" : "quote_systems",
      },
      status: "draft",
      message: "Invoice is a draft. Human approval required before issuance.",
    };
  });

// ──────────────────────────────────────────────────────────────────────────────
// APPROVE INVOICE — human approval (draft → issued)
// ──────────────────────────────────────────────────────────────────────────────

export const approveInvoice = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        total_cents: z.number().int().min(0).optional(),
        notes: z.string().max(5000).optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = {
      status: "issued",
      updated_at: new Date().toISOString(),
    };

    if (data.total_cents !== undefined) {
      updates.total_cents = toCents(data.total_cents / 100);
    }
    if (data.notes !== undefined) {
      updates.notes = data.notes;
    }

    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .update(updates)
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return invoice as InvoiceRow;
  });
