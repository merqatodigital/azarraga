// ── Azarraga Glass & Aluminum — PO Ingestion & Commercial Memory ─────────────
//
// Backend integration layer connecting uploaded client documents to the full
// business workflow:
//
//   CLIENT / BUSINESS
//   → LEAD
//   → UPLOADED DOCUMENTS (client_docs)
//   → PO / QUOTATION / SKETCH / CONTRACT
//   → ITEMS PURCHASED (items_purchased)
//   → PROJECT
//   → QUOTE (with carry-forward from lead + PO + historical evidence)
//   → APPROVED QUOTE
//   → INVOICE (draft inherits from approved quote/project)
//   → PAYMENT RECORD
//   → COMMERCIAL MEMORY (evidence-backed retrieval)
//
// Every historical value retains provenance to its source document.
// The deterministic engine does all money arithmetic.
// The human approves the commercial document.
// The AGENT may interpret documents and propose a takeoff.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  toCents,
  fromCents,
  formatCents,
  sumCents,
} from "@/lib/operations";
import type { CustomerRow, ProjectRow, ClientPORow, InvoiceRow } from "@/lib/operations";
import {
  createCustomer,
  getCustomer,
  updateCustomer,
  createProject,
  getProject,
  updateProject,
  createClientPO,
  getClientPO,
  updateClientPO,
  listClientPOs,
  createInvoice,
  getInvoice,
  updateInvoice,
  addPOLineItem,
} from "@/lib/operations.server";
import { listLeads } from "@/lib/leads.server";
import { createQuote, getQuote, approveQuote } from "@/lib/quotes.server";
import {
  listClientDocs,
  getClientDoc,
  listItemsPurchased,
} from "@/lib/client-docs.server";

// ──────────────────────────────────────────────────────────────────────────────
// PO NUMBER → LEAD lookup
// ──────────────────────────────────────────────────────────────────────────────

export const findLeadByPONumber = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ po_number: z.string().min(1).max(100) }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: docs } = await supabaseAdmin
      .from("client_docs")
      .select("id, lead_reference, po_number, document_type, file_name")
      .eq("po_number", data.po_number)
      .eq("document_type", "purchase_order")
      .maybeSingle();

    if (!docs) return null;

    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("lead_reference", docs.lead_reference)
      .maybeSingle();

    return lead as any;
  });

// ──────────────────────────────────────────────────────────────────────────────
// CUSTOMER UPSERT FROM LEAD OR PO DATA
// ──────────────────────────────────────────────────────────────────────────────

export const upsertCustomerFromData = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        name: z.string().min(1).max(255),
        contact_name: z.string().max(255).optional(),
        phone: z.string().max(100).optional(),
        email: z.string().max(255).optional(),
        address: z.string().max(1000).optional(),
        city: z.string().max(100).optional(),
        region: z.string().max(100).optional(),
        notes: z.string().max(5000).optional(),
        provenance: z.string().max(500).optional(),
        from_lead_id: z.string().uuid().optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    let existing: CustomerRow | null = null;
    if (data.name) {
      const { data: matches } = await supabaseAdmin
        .from("customers")
        .select("*")
        .or(`name.eq.${data.name}, name.eq.${data.name.toUpperCase()}`);
      if (matches && matches.length > 0) {
        const withContact = matches.filter(
          (c) => c.phone === data.phone || c.email === data.email
        );
        existing = (withContact.length > 0 ? withContact[0] : matches[0]) as CustomerRow;
      }
    }
    if (existing) return existing;

    const customer = await createCustomer({
      data: {
        name: data.name,
        contact_name: data.contact_name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        region: data.region ?? "Palawan",
        notes: data.notes,
        lead_source: data.provenance ?? "unknown",
      },
    });

    if (data.from_lead_id) {
      await supabaseAdmin
        .from("customers")
        .update({
          notes: `${customer.notes || ""} [Converted from lead: ${data.from_lead_id}]`,
        })
        .eq("id", customer.id);
    }
    return customer as CustomerRow;
  });

// ──────────────────────────────────────────────────────────────────────────────
// PROJECT UPSERT
// ──────────────────────────────────────────────────────────────────────────────

export const upsertProject = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        customer_id: z.string().uuid(),
        name: z.string().min(1).max(255),
        description: z.string().max(2000).optional(),
        location: z.string().max(500).optional(),
        stage: z
          .enum([
            "prospect",
            "po-received",
            "procurement-shipping",
            "fabrication",
            "delivery-installation",
            "billing-collection",
            "completed",
          ])
          .optional(),
        po_value_cents: z.number().int().min(0).default(0),
        notes: z.string().max(5000).optional(),
        provenance: z.string().max(500).optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const { data: existing } = await supabaseAdmin
      .from("projects")
      .select("id, name, customer_id, stage, po_value_cents, location, description")
      .eq("name", data.name)
      .eq("customer_id", data.customer_id)
      .maybeSingle();

    if (existing) {
      const updates: Record<string, unknown> = {};
      if (data.location) updates.location = data.location;
      if (data.description) updates.description = data.description;
      if (data.stage) updates.stage = data.stage;
      if (data.po_value_cents !== undefined)
        updates.po_value_cents = toCents(data.po_value_cents / 100);
      if (data.notes) {
        const combined = `${existing.description || existing.notes || ""}${data.notes ? " " + data.notes : ""}`.trim();
        if (combined) updates.notes = combined;
      }
      if (data.provenance) {
        const combined = `${(updates.notes as string) || ""}${data.provenance ? " [From: " + data.provenance + "]" : ""}`.trim();
        if (combined) updates.notes = combined;
      }
      updates.updated_at = new Date().toISOString();
      if (Object.keys(updates).length > 1) {
        await supabaseAdmin.from("projects").update(updates).eq("id", existing.id);
      }
      return (await getProject({ data: { id: existing.id } })) as ProjectRow;
    }

    return createProject({
      data: {
        customer_id: data.customer_id,
        name: data.name,
        description: data.description,
        location: data.location,
        stage: data.stage ?? "prospect",
        po_value_cents: data.po_value_cents,
        notes: data.provenance
          ? `[From: ${data.provenance}]${data.notes ? " " + data.notes : ""}`
          : data.notes,
      },
    }) as Promise<ProjectRow>;
  });

// ──────────────────────────────────────────────────────────────────────────────
// PO INGESTION
// ──────────────────────────────────────────────────────────────────────────────
//
// Given an uploaded PO document and extracted PO data:
//   1. Finds or creates the customer
//   2. Finds or creates the project
//   3. Creates the client_po record with full PO data
//   4. Records the items purchased (cross-referenced to client_docs)
//   5. Links line items to the PO for invoice inheritance
//   6. Returns the full chain with provenance
//
// The human reviews and approves before the PO is considered official.

export const ingestPO = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        client_doc_id: z.string().uuid(),
        po_number: z.string().min(1).max(100),
        po_date: z.string().max(10).optional(),
        customer_name: z.string().min(1).max(255),
        contact_name: z.string().max(255).optional(),
        phone: z.string().max(100).optional(),
        email: z.string().max(255).optional(),
        address: z.string().max(1000).optional(),
        city: z.string().max(100).optional(),
        tin: z.string().max(50).optional(),
        project_name: z.string().min(1).max(255).optional(),
        project_location: z.string().max(500).optional(),
        project_description: z.string().max(2000).optional(),
        subtotal_cents: z.number().int().min(0).optional(),
        logistics_cents: z.number().int().min(0).optional(),
        installation_cents: z.number().int().min(0).optional(),
        discount_cents: z.number().int().min(0).optional(),
        tax_cents: z.number().int().min(0).optional(),
        total_cents: z.number().int().min(0).optional(),
        payment_terms: z.string().max(500).optional(),
        lead_time: z.string().max(200).optional(),
        line_items: z
          .array(
            z.object({
              description: z.string().min(1).max(500),
              quantity: z.number().int().positive(),
              unit: z.string().max(50).default("sets"),
              unit_price_cents: z.number().int().min(0),
              product_type: z.string().max(100).optional(),
              glass_type: z.string().max(100).optional(),
              glass_thickness_mm: z.number().int().positive().optional(),
              aluminum_system: z.string().max(100).optional(),
              dimensions_w_mm: z.number().int().positive().optional(),
              dimensions_h_mm: z.number().int().positive().optional(),
            })
          )
          .default([]),
        lead_reference: z.string().max(50).optional(),
        source: z.string().max(200).optional(),
        notes: z.string().max(5000).optional(),
      })
      .refine(
        (d) => d.customer_name || d.project_name || d.lead_reference,
        "Provide customer_name, project_name, or lead_reference"
      )
      .parse(input)
  )
  .handler(async ({ data }) => {
    const doc = await getClientDoc({ data: { id: data.client_doc_id } });
    if (!doc) throw new Error("Client document not found");

    const poNumber = data.po_number.replace(/[^a-zA-Z0-9\-_.]/g, "_");

    // 1. Upsert customer
    const customer = await upsertCustomerFromData({
      data: {
        name: data.customer_name,
        contact_name: data.contact_name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        region: data.city ? "Palawan" : undefined,
        notes: `TIN: ${data.tin || "N/A"}`,
        provenance: data.source || "PO ingestion",
        from_lead_id: data.lead_reference
          ? (await findLeadByPONumber({ data: { po_number: data.po_number } }))?.id
          : undefined,
      },
    });

    // 2. Upsert project
    const projectName = data.project_name || `Project ${poNumber}`;
    const project = await upsertProject({
      data: {
        customer_id: customer.id,
        name: projectName,
        description: data.project_description,
        location: data.project_location,
        stage: "po-received",
        po_value_cents: data.total_cents ?? 0,
        provenance: `${data.source || "PO ingestion"} — PO ${poNumber}`,
        notes: data.notes,
      },
    });

    // 3. Create or update client_po
    const { data: existingPO } = await supabaseAdmin
      .from("client_po")
      .select("id")
      .eq("project_id", project.id)
      .eq("po_number", poNumber)
      .maybeSingle();

    let poId: string;

    if (existingPO) {
      await supabaseAdmin
        .from("client_po")
        .update({
          issued_date: data.po_date ? new Date(data.po_date).toISOString().split("T")[0] : undefined,
          total_cents: toCents((data.total_cents ?? 0) / 100),
          notes: data.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPO.id);
      poId = existingPO.id;
    } else {
      const po = await createClientPO({
        data: {
          project_id: project.id,
          po_number: poNumber,
          issued_date: data.po_date,
          total_cents: data.total_cents ?? 0,
          notes: data.notes,
          documents: {
            client_doc_id: data.client_doc_id,
            file_name: doc.file_name,
            file_url: doc.file_url,
            document_type: doc.document_type,
            uploaded_by: doc.uploaded_by,
            provenance: data.source || "client upload",
          },
        },
      });
      poId = po.id;
    }

    // 4. Record items_purchased
    for (const item of data.line_items) {
      const lineTotalCents = item.quantity * item.unit_price_cents;
      await supabaseAdmin
        .from("items_purchased")
        .insert({
          lead_reference: data.lead_reference ?? null,
          po_number: poNumber,
          client_doc_id: data.client_doc_id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price_cents: toCents(item.unit_price_cents / 100),
          total_cents: toCents(lineTotalCents / 100),
          project_name: projectName,
          class_name: item.product_type || undefined,
        })
        .catch(() => {});
    }

    // 5. Record PO line items for invoice inheritance
    for (let i = 0; i < data.line_items.length; i++) {
      const item = data.line_items[i];
      const lineTotalCents = item.quantity * item.unit_price_cents;
      await addPOLineItem({
        data: {
          client_po_id: poId,
          description: item.description,
          product_type: item.product_type,
          glass_type: item.glass_type,
          glass_thickness_mm: item.glass_thickness_mm,
          aluminum_system: item.aluminum_system,
          quantity: item.quantity,
          unit: item.unit,
          unit_price_cents: item.unit_price_cents,
          line_total_cents: lineTotalCents,
          remarks: `${data.source || "PO ingestion"}`,
          sort_order: i + 1,
        },
      }).catch(() => {});
    }

    // 6. Return full chain
    return {
      customer: customer as CustomerRow,
      project: project as ProjectRow,
      po: (await getClientPO({ data: { id: poId } })) as ClientPORow,
      items_purchased: await listItemsPurchased({ data: { po_number: poNumber } }),
      provenance: {
        source: data.source || "PO ingestion",
        client_doc_id: data.client_doc_id,
        file_name: doc.file_name,
        po_number: poNumber,
      },
    };
  });
