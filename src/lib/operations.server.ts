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
// CUSTOMERS
// ──────────────────────────────────────────────────────────────────────────────

export const listCustomers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("customers").select("*").order("name");
  if (error) throw new Error(error.message);
  return data as CustomerRow[];
});

export const getCustomer = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: customer, error } = await supabaseAdmin
      .from("customers").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    return customer as CustomerRow;
  });

export const createCustomer = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      name: z.string().min(1).max(255),
      contact_name: z.string().max(255).optional(),
      phone: z.string().max(100).optional(),
      email: z.string().max(255).optional(),
      address: z.string().max(1000).optional(),
      city: z.string().max(100).optional(),
      region: z.string().max(100).optional(),
      notes: z.string().max(5000).optional(),
      lead_source: z.string().max(100).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: customer, error } = await supabaseAdmin
      .from("customers").insert({
        name: data.name,
        contact_name: data.contact_name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        region: data.region ?? (data.city ? "Palawan" : undefined),
        notes: data.notes,
        lead_source: data.lead_source,
      }).select().single();
    if (error) throw new Error(error.message);
    return customer as CustomerRow;
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      contact_name: z.string().max(255).optional(),
      phone: z.string().max(100).optional(),
      email: z.string().max(255).optional(),
      address: z.string().max(1000).optional(),
      city: z.string().max(100).optional(),
      region: z.string().max(100).optional(),
      notes: z.string().max(5000).optional(),
      lead_source: z.string().max(100).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.contact_name !== undefined) updates.contact_name = data.contact_name;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.email !== undefined) updates.email = data.email;
    if (data.address !== undefined) updates.address = data.address;
    if (data.city !== undefined) updates.city = data.city;
    if (data.region !== undefined) updates.region = data.region;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.lead_source !== undefined) updates.lead_source = data.lead_source;

    updates.updated_at = new Date().toISOString();

    const { data: customer, error } = await supabaseAdmin
      .from("customers").update(updates).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    return customer as CustomerRow;
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("customers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// PROJECTS
// ──────────────────────────────────────────────────────────────────────────────

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select(`
      *,
      customer:customers(id, name),
      client_po(client_po(id, po_number, total_cents, invoiced_cents)),
      costs(project_costs(id, cost_category, amount_cents, is_commitment, confirmed))
    `)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as (ProjectRow & {
    customer?: CustomerRow;
    client_po?: ClientPORow[];
    costs?: ProjectCostRow[];
  })[];
});

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select(`
        *,
        customer:customers(id, name, contact_name, phone, email),
        client_po(client_po(id, po_number, issued_date, total_cents, invoiced_cents, milestone1_invoiced, milestone2_invoiced, milestone3_invoiced)),
        invoice_items(
          invoice_line_items(id, sort_order, description, quantity, unit, unit_price_cents,
            discount_cents, tax_cents, line_total_cents, product_type, glass_type,
            glass_thickness_mm, aluminum_system),
          invoices(id, invoice_number, status, total_cents, amount_paid_cents, due_date, billing_milestone),
          payments(id, payment_number, amount_cents, payment_date, payment_method, reference, confirmed)
        ),
        costs(project_costs(id, cost_category, description, amount_cents, incurred_date, is_commitment, confirmed, supplier_po:supplier_po(id, po_number)))
      `)
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return project as ProjectRow & {
      customer?: CustomerRow;
      client_po?: ClientPORow[];
      invoice_items?: (InvoiceLineItemRow & {
        invoices?: InvoiceRow & { payments?: PaymentRow[] };
      })[];
      costs?: (ProjectCostRow & { supplier_po?: SupplierPORow })[];
    };
  });

export const createProject = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      name: z.string().min(1).max(255),
      customer_id: z.string().uuid(),
      description: z.string().max(2000).optional(),
      location: z.string().max(500).optional(),
      stage: z.enum([
        "prospect", "po-received", "procurement-shipping",
        "fabrication", "delivery-installation", "billing-collection", "completed"
      ]).default("prospect"),
      po_value_cents: z.number().int().min(0).default(0),
      notes: z.string().max(5000).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: project, error } = await supabaseAdmin
      .from("projects").insert({
        name: data.name,
        customer_id: data.customer_id,
        description: data.description,
        location: data.location,
        stage: data.stage,
        po_value_cents: toCents(data.po_value_cents / 100),
        notes: data.notes,
      }).select()
      .single();
    if (error) throw new Error(error.message);
    return project as ProjectRow;
  });

export const updateProject = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(2000).optional(),
      location: z.string().max(500).optional(),
      stage: z.enum([
        "prospect", "po-received", "procurement-shipping",
        "fabrication", "delivery-installation", "billing-collection", "completed"
      ]).optional(),
      po_value_cents: z.number().int().min(0).optional(),
      notes: z.string().max(5000).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.location !== undefined) updates.location = data.location;
    if (data.stage !== undefined) updates.stage = data.stage;
    if (data.po_value_cents !== undefined) updates.po_value_cents = toCents(data.po_value_cents / 100);
    if (data.notes !== undefined) updates.notes = data.notes;
    updates.updated_at = new Date().toISOString();

    const { data: project, error } = await supabaseAdmin
      .from("projects").update(updates).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    return project as ProjectRow;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// CLIENT POs
// ──────────────────────────────────────────────────────────────────────────────

export const listClientPOs = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ project_id: z.string().uuid() }).optional())
  .handler(async ({ data }) => {
    const query = supabaseAdmin
      .from("client_po")
      .select(`
        *,
        project:projects(id, name, customer:customers(id, name))
      `)
      .order("created_at", { ascending: false });

    if (data?.project_id) {
      query.eq("project_id", data.project_id);
    }

    const { data: pos, error } = await query;
    if (error) throw new Error(error.message);
    return pos as (ClientPORow & { project?: ProjectRow & { customer?: CustomerRow } })[];
  });

export const getClientPO = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: po, error } = await supabaseAdmin
      .from("client_po")
      .select(`
        *,
        project:projects(id, name, customer:customers(id, name)),
        items(po_line_items(id, sort_order, description, product_type, glass_type, glass_thickness_mm,
          aluminum_system, quantity, unit, unit_price_cents, discount_cents, tax_cents, line_total_cents, remarks))
      `)
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return po as ClientPORow & {
      project?: ProjectRow & { customer?: CustomerRow };
      items?: POLineItemRow[];
    };
  });

export const createClientPO = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      project_id: z.string().uuid(),
      po_number: z.string().min(1).max(100),
      issued_date: z.string().optional(),
      total_cents: z.number().int().min(0).default(0),
      notes: z.string().max(5000).optional(),
      documents: z.record(z.unknown()).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: po, error } = await supabaseAdmin
      .from("client_po").insert({
        project_id: data.project_id,
        po_number: data.po_number,
        issued_date: data.issued_date ? new Date(data.issued_date).toISOString().split("T")[0] : null,
        total_cents: toCents(data.total_cents / 100),
        notes: data.notes,
        documents: data.documents ? JSON.stringify(data.documents) : null,
      }).select().single();
    if (error) throw new Error(error.message);
    return po as ClientPORow;
  });

export const updateClientPO = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      po_number: z.string().min(1).max(100).optional(),
      issued_date: z.string().optional(),
      total_cents: z.number().int().min(0).optional(),
      milestone1_invoiced: z.boolean().optional(),
      milestone2_invoiced: z.boolean().optional(),
      milestone3_invoiced: z.boolean().optional(),
      notes: z.string().max(5000).optional(),
      documents: z.record(z.unknown()).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = {};
    if (data.po_number !== undefined) updates.po_number = data.po_number;
    if (data.issued_date !== undefined) updates.issued_date = data.issued_date;
    if (data.total_cents !== undefined) updates.total_cents = toCents(data.total_cents / 100);
    if (data.milestone1_invoiced !== undefined) updates.milestone1_invoiced = data.milestone1_invoiced;
    if (data.milestone2_invoiced !== undefined) updates.milestone2_invoiced = data.milestone2_invoiced;
    if (data.milestone3_invoiced !== undefined) updates.milestone3_invoiced = data.milestone3_invoiced;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.documents !== undefined) updates.documents = JSON.stringify(data.documents);
    updates.updated_at = new Date().toISOString();

    const { data: po, error } = await supabaseAdmin
      .from("client_po").update(updates).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    return po as ClientPORow;
  });

export const deleteClientPO = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("client_po").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// PO LINE ITEMS
// ──────────────────────────────────────────────────────────────────────────────

export const addPOLineItem = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      client_po_id: z.string().uuid(),
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
      sort_order: z.number().int().min(0).default(0),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const lineTotal = toCents(data.line_total_cents / 100);
    const { data: item, error } = await supabaseAdmin
      .from("po_line_items").insert({
        client_po_id: data.client_po_id,
        description: data.description,
        product_type: data.product_type,
        glass_type: data.glass_type,
        glass_thickness_mm: data.glass_thickness_mm,
        aluminum_system: data.aluminum_system,
        quantity: data.quantity,
        unit: data.unit,
        unit_price_cents: toCents(data.unit_price_cents / 100),
        discount_cents: toCents(data.discount_cents / 100),
        tax_cents: toCents(data.tax_cents / 100),
        line_total_cents: lineTotal,
        remarks: data.remarks,
        sort_order: data.sort_order,
      }).select().single();
    if (error) throw new Error(error.message);
    return item as POLineItemRow;
  });

export const updatePOLineItem = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      description: z.string().min(1).max(1000).optional(),
      product_type: z.string().max(100).optional(),
      glass_type: z.string().max(100).optional(),
      glass_thickness_mm: z.number().int().min(0).optional(),
      aluminum_system: z.string().max(100).optional(),
      quantity: z.number().int().min(1).optional(),
      unit: z.string().max(20).optional(),
      unit_price_cents: z.number().int().min(0).optional(),
      discount_cents: z.number().int().min(0).optional(),
      tax_cents: z.number().int().min(0).optional(),
      line_total_cents: z.number().int().optional(),
      remarks: z.string().max(1000).optional(),
      sort_order: z.number().int().min(0).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = {};
    if (data.description !== undefined) updates.description = data.description;
    if (data.product_type !== undefined) updates.product_type = data.product_type;
    if (data.glass_type !== undefined) updates.glass_type = data.glass_type;
    if (data.glass_thickness_mm !== undefined) updates.glass_thickness_mm = data.glass_thickness_mm;
    if (data.aluminum_system !== undefined) updates.aluminum_system = data.aluminum_system;
    if (data.quantity !== undefined) updates.quantity = data.quantity;
    if (data.unit !== undefined) updates.unit = data.unit;
    if (data.unit_price_cents !== undefined) updates.unit_price_cents = toCents(data.unit_price_cents / 100);
    if (data.discount_cents !== undefined) updates.discount_cents = toCents(data.discount_cents / 100);
    if (data.tax_cents !== undefined) updates.tax_cents = toCents(data.tax_cents / 100);
    if (data.line_total_cents !== undefined) updates.line_total_cents = toCents(data.line_total_cents / 100);
    if (data.remarks !== undefined) updates.remarks = data.remarks;
    if (data.sort_order !== undefined) updates.sort_order = data.sort_order;

    const { data: item, error } = await supabaseAdmin
      .from("po_line_items").update(updates).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    return item as POLineItemRow;
  });

export const deletePOLineItem = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("po_line_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// INVOICES
// ──────────────────────────────────────────────────────────────────────────────

export const listInvoices = createServerFn({ method: "GET" })
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
      .select(`
        *,
        customer:customers(id, name),
        project:projects(id, name, customer:customers(id, name)),
        client_po:client_po(id, po_number),
        line_items(
          invoice_line_items(id, sort_order, description, product_type, glass_type,
            glass_thickness_mm, aluminum_system, quantity, unit, unit_price_cents,
            discount_cents, tax_cents, line_total_cents, remarks),
          payments(id, payment_number, amount_cents, payment_date, payment_method, reference, confirmed)
        )
      `)
      .order("issue_date", { ascending: false });

    if (data?.customer_id) query.eq("customer_id", data.customer_id);
    if (data?.project_id) query.eq("project_id", data.project_id);
    if (data?.status) query.eq("status", data.status);

    const { data: invoices, error } = await query;
    if (error) throw new Error(error.message);
    return invoices as (InvoiceRow & {
      customer?: CustomerRow;
      project?: (ProjectRow & { customer?: CustomerRow }) | null;
      client_po?: ClientPORow | null;
      line_items?: (InvoiceLineItemRow & { payments?: PaymentRow[] })[];
    })[];
  });

export const getInvoice = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .select(`
        *,
        customer:customers(id, name, contact_name, phone, email),
        project:projects(id, name, customer:customers(id, name)),
        client_po:client_po(id, po_number, total_cents, invoiced_cents),
        line_items(
          invoice_line_items(id, sort_order, description, product_type, glass_type,
            glass_thickness_mm, aluminum_system, quantity, unit, unit_price_cents,
            discount_cents, tax_cents, line_total_cents, remarks),
          payments(id, payment_number, amount_cents, payment_date, payment_method, reference, confirmed)
        )
      `)
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    // Compute balance deterministically from payments
    const payments = invoice.line_items?.flatMap((li) => li.payments ?? []) ?? [];
    const totalPaid = sumCents(payments.map((p) => p.amount_cents));

    return {
      ...invoice,
      _balance_cents: computeBalance(invoice.total_cents, totalPaid),
      _paid_cents: totalPaid,
    } as InvoiceRow & { _balance_cents: number; _paid_cents: number };
  });

export const createInvoice = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      customer_id: z.string().uuid(),
      project_id: z.string().uuid(),
      client_po_id: z.string().uuid().optional(),
      due_date: z.string().optional(),
      billing_milestone: z.string().max(100).optional(),
      line_items: z.array(z.object({
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
      })),
      subtotal_cents: z.number().int(),
      discount_cents: z.number().int().min(0).default(0),
      tax_cents: z.number().int().min(0).default(0),
      total_cents: z.number().int(),
      notes: z.string().max(5000).optional(),
      payment_terms: z.string().max(200).optional(),
      status: z.enum(["draft", "issued"]).default("draft"),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    // Generate invoice number
    const { data: numResult } = await supabaseAdmin
      .rpc("next_invoice_number", {})
      .single();

    const invoiceNumber = typeof numResult === "string" ? numResult : `AZ-00001`;

    // Validate money consistency
    const expectedTotal = data.subtotal_cents - data.discount_cents + data.tax_cents;
    if (expectedTotal !== data.total_cents) {
      throw new Error(
        `Money mismatch: subtotal(${data.subtotal_cents}) - discount(${data.discount_cents}) + tax(${data.tax_cents}) = ${expectedTotal}, but total_cents = ${data.total_cents}`
      );
    }

    const { data: invoice, error } = await supabaseAdmin
      .from("invoices").insert({
        invoice_number: invoiceNumber,
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
        status: data.status,
      }).select().single();

    if (error) throw new Error(error.message);

    // Insert line items
    const lineItemInserts = data.line_items.map((item, idx) => ({
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

    if (lineItemInserts.length > 0) {
      const { error: liError } = await supabaseAdmin
        .from("invoice_line_items").insert(lineItemInserts);
      if (liError) throw new Error(liError.message);
    }

    const { data: fresh } = await supabaseAdmin
      .from("invoices").select().eq("id", invoice.id).single();

    return fresh as InvoiceRow;
  });

export const updateInvoice = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      due_date: z.string().optional(),
      billing_milestone: z.string().max(100).optional(),
      notes: z.string().max(5000).optional(),
      payment_terms: z.string().max(200).optional(),
      status: z.enum(["draft", "issued", "partially-paid", "paid", "overdue", "cancelled"]).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = {};
    if (data.due_date !== undefined) updates.due_date = data.due_date;
    if (data.billing_milestone !== undefined) updates.billing_milestone = data.billing_milestone;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.payment_terms !== undefined) updates.payment_terms = data.payment_terms;
    if (data.status !== undefined) updates.status = data.status;
    updates.updated_at = new Date().toISOString();

    const { data: invoice, error } = await supabaseAdmin
      .from("invoices").update(updates).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    return invoice as InvoiceRow;
  });

export const cancelInvoice = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("invoices")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// INVOICE LINE ITEMS
// ──────────────────────────────────────────────────────────────────────────────

export const addInvoiceLineItem = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      invoice_id: z.string().uuid(),
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
      sort_order: z.number().int().min(0).default(0),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: item, error } = await supabaseAdmin
      .from("invoice_line_items").insert({
        invoice_id: data.invoice_id,
        sort_order: data.sort_order,
        description: data.description,
        product_type: data.product_type,
        glass_type: data.glass_type,
        glass_thickness_mm: data.glass_thickness_mm,
        aluminum_system: data.aluminum_system,
        quantity: data.quantity,
        unit: data.unit,
        unit_price_cents: toCents(data.unit_price_cents / 100),
        discount_cents: toCents(data.discount_cents / 100),
        tax_cents: toCents(data.tax_cents / 100),
        line_total_cents: toCents(data.line_total_cents / 100),
        remarks: data.remarks,
      }).select().single();
    if (error) throw new Error(error.message);
    return item as InvoiceLineItemRow;
  });

export const updateInvoiceLineItem = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      description: z.string().min(1).max(1000).optional(),
      product_type: z.string().max(100).optional(),
      glass_type: z.string().max(100).optional(),
      glass_thickness_mm: z.number().int().min(0).optional(),
      aluminum_system: z.string().max(100).optional(),
      quantity: z.number().int().min(1).optional(),
      unit: z.string().max(20).optional(),
      unit_price_cents: z.number().int().min(0).optional(),
      discount_cents: z.number().int().min(0).optional(),
      tax_cents: z.number().int().min(0).optional(),
      line_total_cents: z.number().int().optional(),
      remarks: z.string().max(1000).optional(),
      sort_order: z.number().int().min(0).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = {};
    if (data.description !== undefined) updates.description = data.description;
    if (data.product_type !== undefined) updates.product_type = data.product_type;
    if (data.glass_type !== undefined) updates.glass_type = data.glass_type;
    if (data.glass_thickness_mm !== undefined) updates.glass_thickness_mm = data.glass_thickness_mm;
    if (data.aluminum_system !== undefined) updates.aluminum_system = data.aluminum_system;
    if (data.quantity !== undefined) updates.quantity = data.quantity;
    if (data.unit !== undefined) updates.unit = data.unit;
    if (data.unit_price_cents !== undefined) updates.unit_price_cents = toCents(data.unit_price_cents / 100);
    if (data.discount_cents !== undefined) updates.discount_cents = toCents(data.discount_cents / 100);
    if (data.tax_cents !== undefined) updates.tax_cents = toCents(data.tax_cents / 100);
    if (data.line_total_cents !== undefined) updates.line_total_cents = toCents(data.line_total_cents / 100);
    if (data.remarks !== undefined) updates.remarks = data.remarks;
    if (data.sort_order !== undefined) updates.sort_order = data.sort_order;

    const { data: item, error } = await supabaseAdmin
      .from("invoice_line_items").update(updates).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    return item as InvoiceLineItemRow;
  });

export const deleteInvoiceLineItem = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("invoice_line_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ──────────────────────────────────────────────────────────────────────────────

export const createPayment = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      invoice_id: z.string().uuid(),
      amount_cents: z.number().int().min(1),
      payment_method: z.string().max(100).optional(),
      reference: z.string().max(255).optional(),
      notes: z.string().max(5000).optional(),
      confirmed: z.boolean().default(false),
      payment_date: z.string().optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    // Generate payment number based on invoice's existing payment count
    const { data: count } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("invoice_id", data.invoice_id)
      .maybeSingle();

    const existing = await supabaseAdmin
      .from("payments")
      .select("payment_number")
      .eq("invoice_id", data.invoice_id)
      .order("payment_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    let paymentNum = 1;
    if (existing && existing.payment_number) {
      const last = parseInt(existing.payment_number.replace(/\D/g, ""), 10);
      paymentNum = isNaN(last) ? 1 : last + 1;
    }

    const paymentNumber = `PY-${paymentNum.toString().padStart(3, "0")}`;

    const { data: payment, error } = await supabaseAdmin
      .from("payments").insert({
        invoice_id: data.invoice_id,
        payment_number: paymentNumber,
        amount_cents: toCents(data.amount_cents / 100),
        payment_method: data.payment_method,
        reference: data.reference,
        notes: data.notes,
        confirmed: data.confirmed,
        payment_date: data.payment_date,
      }).select().single();

    if (error) throw new Error(error.message);
    return payment as PaymentRow;
  });

export const confirmPayment = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      payment_id: z.string().uuid(),
      confirmed: z.boolean(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .update({ confirmed: data.confirmed })
      .eq("id", data.payment_id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return payment as PaymentRow;
  });

export const deletePayment = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("payments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// SUPPLIERS
// ──────────────────────────────────────────────────────────────────────────────

export const listSuppliers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("suppliers").select("*").order("name");
  if (error) throw new Error(error.message);
  return data as SupplierRow[];
});

export const createSupplier = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      name: z.string().min(1).max(255),
      contact_name: z.string().max(255).optional(),
      phone: z.string().max(100).optional(),
      email: z.string().max(255).optional(),
      address: z.string().max(1000).optional(),
      notes: z.string().max(5000).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: supplier, error } = await supabaseAdmin
      .from("suppliers").insert(data).select().single();
    if (error) throw new Error(error.message);
    return supplier as SupplierRow;
  });

export const updateSupplier = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      contact_name: z.string().max(255).optional(),
      phone: z.string().max(100).optional(),
      email: z.string().max(255).optional(),
      address: z.string().max(1000).optional(),
      notes: z.string().max(5000).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: supplier, error } = await supabaseAdmin
      .from("suppliers").update(data).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    return supplier as SupplierRow;
  });

export const deleteSupplier = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("suppliers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// SUPPLIER PO
// ──────────────────────────────────────────────────────────────────────────────

export const listSupplierPOs = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({
      supplier_id: z.string().uuid().optional(),
      project_id: z.string().uuid().optional(),
    }).optional()
  )
  .handler(async ({ data }) => {
    const query = supabaseAdmin
      .from("supplier_po")
      .select(`
        *,
        supplier:suppliers(id, name),
        project:projects(id, name)
      `)
      .order("po_date", { ascending: false });

    if (data?.supplier_id) query.eq("supplier_id", data.supplier_id);
    if (data?.project_id) query.eq("project_id", data.project_id);

    const { data: pos, error } = await query;
    if (error) throw new Error(error.message);
    return pos as (SupplierPORow & { supplier?: SupplierRow; project?: ProjectRow })[];
  });

export const createSupplierPO = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      supplier_id: z.string().uuid(),
      project_id: z.string().uuid().optional(),
      po_number: z.string().min(1).max(100),
      po_date: z.string().optional(),
      status: z.enum(["draft", "placed", "shipped", "delivered", "paid", "cancelled"]).default("draft"),
      subtotal_cents: z.number().int().min(0).default(0),
      vat_cents: z.number().int().min(0).default(0),
      shipping_cents: z.number().int().min(0).default(0),
      total_cents: z.number().int().default(0),
      notes: z.string().max(5000).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: po, error } = await supabaseAdmin
      .from("supplier_po").insert({
        supplier_id: data.supplier_id,
        project_id: data.project_id,
        po_number: data.po_number,
        po_date: data.po_date,
        status: data.status,
        subtotal_cents: toCents(data.subtotal_cents / 100),
        vat_cents: toCents(data.vat_cents / 100),
        shipping_cents: toCents(data.shipping_cents / 100),
        total_cents: toCents(data.total_cents / 100),
        notes: data.notes,
      }).select().single();
    if (error) throw new Error(error.message);
    return po as SupplierPORow;
  });

export const updateSupplierPO = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      po_number: z.string().min(1).max(100).optional(),
      po_date: z.string().optional(),
      status: z.enum(["draft", "placed", "shipped", "delivered", "paid", "cancelled"]).optional(),
      subtotal_cents: z.number().int().min(0).optional(),
      vat_cents: z.number().int().min(0).optional(),
      shipping_cents: z.number().int().min(0).optional(),
      total_cents: z.number().int().optional(),
      notes: z.string().max(5000).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = {};
    if (data.po_number !== undefined) updates.po_number = data.po_number;
    if (data.po_date !== undefined) updates.po_date = data.po_date;
    if (data.status !== undefined) updates.status = data.status;
    if (data.subtotal_cents !== undefined) updates.subtotal_cents = toCents(data.subtotal_cents / 100);
    if (data.vat_cents !== undefined) updates.vat_cents = toCents(data.vat_cents / 100);
    if (data.shipping_cents !== undefined) updates.shipping_cents = toCents(data.shipping_cents / 100);
    if (data.total_cents !== undefined) updates.total_cents = toCents(data.total_cents / 100);
    if (data.notes !== undefined) updates.notes = data.notes;
    updates.updated_at = new Date().toISOString();

    const { data: po, error } = await supabaseAdmin
      .from("supplier_po").update(updates).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    return po as SupplierPORow;
  });

export const deleteSupplierPO = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("supplier_po").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// PROJECT COSTS
// ──────────────────────────────────────────────────────────────────────────────

export const listProjectCosts = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ project_id: z.string().uuid() }).optional())
  .handler(async ({ data }) => {
    const query = supabaseAdmin
      .from("project_costs")
      .select(`
        *,
        supplier_po:supplier_po(id, po_number, supplier:suppliers(id, name))
      `)
      .order("created_at", { ascending: false });

    if (data?.project_id) query.eq("project_id", data.project_id);

    const { data: costs, error } = await query;
    if (error) throw new Error(error.message);
    return costs as (ProjectCostRow & { supplier_po?: SupplierPORow & { supplier?: SupplierRow } })[];
  });

export const addProjectCost = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      project_id: z.string().uuid(),
      supplier_po_id: z.string().uuid().optional(),
      cost_category: z.enum(["materials", "shipping", "labor", "overhead", "other"]).default("materials"),
      description: z.string().max(1000).optional(),
      amount_cents: z.number().int().min(0),
      incurred_date: z.string().optional(),
      is_commitment: z.boolean().default(false),
      confirmed: z.boolean().default(false),
      notes: z.string().max(5000).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: cost, error } = await supabaseAdmin
      .from("project_costs").insert({
        project_id: data.project_id,
        supplier_po_id: data.supplier_po_id,
        cost_category: data.cost_category,
        description: data.description,
        amount_cents: toCents(data.amount_cents / 100),
        incurred_date: data.incurred_date,
        is_commitment: data.is_commitment,
        confirmed: data.confirmed,
        notes: data.notes,
      }).select().single();
    if (error) throw new Error(error.message);
    return cost as ProjectCostRow;
  });

export const updateProjectCost = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      cost_category: z.enum(["materials", "shipping", "labor", "overhead", "other"]).optional(),
      description: z.string().max(1000).optional(),
      amount_cents: z.number().int().min(0).optional(),
      incurred_date: z.string().optional(),
      is_commitment: z.boolean().optional(),
      confirmed: z.boolean().optional(),
      notes: z.string().max(5000).optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = {};
    if (data.cost_category !== undefined) updates.cost_category = data.cost_category;
    if (data.description !== undefined) updates.description = data.description;
    if (data.amount_cents !== undefined) updates.amount_cents = toCents(data.amount_cents / 100);
    if (data.incurred_date !== undefined) updates.incurred_date = data.incurred_date;
    if (data.is_commitment !== undefined) updates.is_commitment = data.is_commitment;
    if (data.confirmed !== undefined) updates.confirmed = data.confirmed;
    if (data.notes !== undefined) updates.notes = data.notes;

    const { data: cost, error } = await supabaseAdmin
      .from("project_costs").update(updates).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    return cost as ProjectCostRow;
  });

export const deleteProjectCost = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("project_costs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// DASHBOARD AGGREGATIONS
// ──────────────────────────────────────────────────────────────────────────────

export const getDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = supabaseAdmin;

  // Total receivables (outstanding invoice balances)
  const { data: receivables } = await supabase
    .from("invoices")
    .select("total_cents, amount_paid_cents")
    .neq("status", "cancelled")
    .neq("status", "paid")
    .eq("status", "paid")
    .or(`status.in(${JSON.stringify(["issued", "partially-paid", "overdue"])})`);

  // Actually use the right filter
  const { data: openInvoices } = await supabase
    .from("invoices")
    .select("total_cents, amount_paid_cents, due_date, status")
    .not("status", "eq", "cancelled")
    .order("due_date");

  let totalReceivables = 0;
  let overdueCount = 0;
  let collectionsDue = 0;
  const today = new Date().toISOString().split("T")[0];

  if (openInvoices) {
    for (const inv of openInvoices) {
      if (inv.status === "paid" || inv.status === "cancelled") continue;
      const balance = computeBalance(inv.total_cents, inv.amount_paid_cents);
      totalReceivables += balance;
      if (inv.due_date && inv.due_date < today) {
        overdueCount++;
      }
      if (inv.due_date === today) {
        collectionsDue++;
      }
    }
  }

  // Active projects
  const { data: activeProjects } = await supabase
    .from("projects")
    .select("*")
    .neq("stage", "completed")
    .neq("stage", "prospect");

  // Projects requiring billing (in delivery-installation or billing-collection stage)
  const { data: billingProjects } = await supabase
    .from("projects")
    .select("*")
    .in("stage", ["delivery-installation", "billing-collection"]);

  // Outstanding balance from open invoices tied to these projects
  let billingOutstanding = 0;
  if (billingProjects) {
    const projectIds = billingProjects.map((p) => p.id);
    const { data: billingInvoices } = await supabase
      .from("invoices")
      .select("total_cents, amount_paid_cents")
      .in("project_id", projectIds)
      .not("status", "eq", "paid")
      .not("status", "eq", "cancelled");

    if (billingInvoices) {
      for (const inv of billingInvoices) {
        billingOutstanding += computeBalance(inv.total_cents, inv.amount_paid_cents);
      }
    }
  }

  return {
    totalReceivables,
    activeProjectsCount: activeProjects?.length ?? 0,
    overdueCount,
    collectionsDue,
    billingOutstanding,
    billingProjectsCount: billingProjects?.length ?? 0,
  };
});
