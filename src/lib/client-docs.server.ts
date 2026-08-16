// ── Azarraga Glass & Aluminum — Client Document Upload ──────────────────────
//
// Server-side functions for uploading client documents (POs, quotations,
// sketches, photos) to Supabase storage and tracking them in the
// client_docs table.
//
// Two audiences:
//   - Public (website): clients upload their docs when requesting a quote
//   - Admin (server): admins attach docs to existing leads/POs
//
// All files go to the 'client-docs' bucket. Public-read bucket so admin
// can view files; write via service role only.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "client-docs";
const MAX_BYTES = 20_000_000; // ~19MB

// ──────────────────────────────────────────────────────────────────────────────
// UPLOAD — public-facing (clients upload from website)
// ──────────────────────────────────────────────────────────────────────────────

export const uploadClientDoc = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        // Linking — at least one must be provided
        lead_reference: z.string().max(50).optional(),
        po_number: z.string().max(50).optional(),

        // Document metadata
        document_type: z.enum([
          "purchase_order",
          "quotation",
          "sketch",
          "photo",
          "contract",
          "invoice",
          "payment_proof",
          "other",
        ]),
        file_name: z.string().min(1).max(255),
        file_mime: z.string().min(1).max(127),
        file_size_bytes: z.number().int().positive().max(MAX_BYTES),

        // File content as base64
        data_base64: z.string().min(1).max(MAX_BYTES * 1.4), // base64 inflated ~33%
        notes: z.string().max(2000).optional(),
      })
      .refine(
        (d) => d.lead_reference || d.po_number,
        "Either lead_reference or po_number must be provided"
      )
      .parse(input)
  )
  .handler(async ({ data }) => {
    const safeName = data.file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path =
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    const bytes = Buffer.from(data.data_base64, "base64");

    // Upload to client-docs bucket
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: data.file_mime,
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    // Record in client_docs
    const { data: doc, error: docError } = await supabaseAdmin
      .from("client_docs")
      .insert({
        lead_reference: data.lead_reference ?? null,
        po_number: data.po_number ?? null,
        document_type: data.document_type,
        file_name: data.file_name,
        file_mime: data.file_mime,
        file_size_bytes: data.file_size_bytes,
        file_url: pub.publicUrl,
        storage_path: path,
        uploaded_by: "website",
        notes: data.notes ?? null,
      })
      .select()
      .single();

    if (docError) throw new Error(`Record failed: ${docError.message}`);

    return {
      id: doc.id,
      url: pub.publicUrl,
      path: path,
      lead_reference: doc.lead_reference,
      po_number: doc.po_number,
    };
  });

// ──────────────────────────────────────────────────────────────────────────────
// UPLOAD BY ADMIN — with admin uploader tag
// ──────────────────────────────────────────────────────────────────────────────

export const uploadClientDocAdmin = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        lead_reference: z.string().max(50).optional(),
        po_number: z.string().max(50).optional(),
        document_type: z.enum([
          "purchase_order",
          "quotation",
          "sketch",
          "photo",
          "contract",
          "invoice",
          "payment_proof",
          "other",
        ]),
        file_name: z.string().min(1).max(255),
        file_mime: z.string().min(1).max(127),
        file_size_bytes: z.number().int().positive().max(MAX_BYTES),
        data_base64: z.string().min(1).max(MAX_BYTES * 1.4),
        notes: z.string().max(2000).optional(),
      })
      .refine(
        (d) => d.lead_reference || d.po_number,
        "Either lead_reference or po_number must be provided"
      )
      .parse(input)
  )
  .handler(async ({ data }) => {
    const safeName = data.file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path =
      `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    const bytes = Buffer.from(data.data_base64, "base64");

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: data.file_mime,
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    const { data: doc, error: docError } = await supabaseAdmin
      .from("client_docs")
      .insert({
        lead_reference: data.lead_reference ?? null,
        po_number: data.po_number ?? null,
        document_type: data.document_type,
        file_name: data.file_name,
        file_mime: data.file_mime,
        file_size_bytes: data.file_size_bytes,
        file_url: pub.publicUrl,
        storage_path: path,
        uploaded_by: "admin",
        notes: data.notes ?? null,
      })
      .select()
      .single();

    if (docError) throw new Error(`Record failed: ${docError.message}`);

    return {
      id: doc.id,
      url: pub.publicUrl,
      path: path,
    };
  });

// ──────────────────────────────────────────────────────────────────────────────
// LIST DOCS for a lead or PO
// ──────────────────────────────────────────────────────────────────────────────

export const listClientDocs = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        lead_reference: z.string().max(50).optional(),
        po_number: z.string().max(50).optional(),
      })
      .refine((d) => d.lead_reference || d.po_number, "Provide lead_reference or po_number")
      .parse(input)
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("client_docs")
      .select("*")
      .order("created_at", { ascending: false });

    if (data.lead_reference) q = q.eq("lead_reference", data.lead_reference);
    if (data.po_number) q = q.eq("po_number", data.po_number);

    const { data: docs, error } = await q;
    if (error) throw new Error(error.message);
    return (docs ?? []) as any[];
  });

// ──────────────────────────────────────────────────────────────────────────────
// GET SINGLE DOC
// ──────────────────────────────────────────────────────────────────────────────

export const getClientDoc = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ id: z.string().uuid() }).parse(input)
  )
  .handler(async ({ data }) => {
    const { data: doc, error } = await supabaseAdmin
      .from("client_docs")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return doc as any;
  });

// ──────────────────────────────────────────────────────────────────────────────
// DELETE DOC (admin only — removes DB record + storage file)
// ──────────────────────────────────────────────────────────────────────────────

export const deleteClientDoc = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ id: z.string().uuid() }).parse(input)
  )
  .handler(async ({ data }) => {
    // Get the doc first to find the storage path
    const { data: doc } = await supabaseAdmin
      .from("client_docs")
      .select("storage_path, lead_reference, po_number")
      .eq("id", data.id)
      .single();

    if (!doc) throw new Error("Document not found");

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove([doc.storage_path]);

    if (storageError) console.error("Storage delete failed:", storageError.message);

    // Delete DB record
    const { error: dbError } = await supabaseAdmin
      .from("client_docs")
      .delete()
      .eq("id", data.id);

    if (dbError) throw new Error(dbError.message);

    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// ADD ITEMS PURCHASED (from uploaded PO data)
// ──────────────────────────────────────────────────────────────────────────────

export const addItemsPurchased = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        lead_reference: z.string().max(50).optional(),
        po_number: z.string().max(50).optional(),
        client_doc_id: z.string().uuid().optional(),
        items: z.array(
          z.object({
            description: z.string().min(1).max(500),
            quantity: z.number().int().positive(),
            unit: z.string().max(50).default("sets"),
            unit_price_cents: z.number().int().positive(),
          })
        ),
        project_name: z.string().max(255).optional(),
        class_name: z.string().max(255).optional(),
      })
      .refine(
        (d) => d.lead_reference || d.po_number || d.client_doc_id,
        "Provide lead_reference, po_number, or client_doc_id"
      )
      .parse(input)
  )
  .handler(async ({ data }) => {
    const inserted = [];
    for (const item of data.items) {
      const totalCents = item.quantity * item.unit_price_cents;
      const { data: row, error } = await supabaseAdmin
        .from("items_purchased")
        .insert({
          lead_reference: data.lead_reference ?? null,
          po_number: data.po_number ?? null,
          client_doc_id: data.client_doc_id ?? null,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price_cents: item.unit_price_cents,
          total_cents: totalCents,
          project_name: data.project_name ?? null,
          class_name: data.class_name ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(`Item insert failed: ${error.message}`);
      inserted.push(row);
    }
    return inserted;
  });

// ──────────────────────────────────────────────────────────────────────────────
// LIST ITEMS PURCHASED
// ──────────────────────────────────────────────────────────────────────────────

export const listItemsPurchased = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        lead_reference: z.string().max(50).optional(),
        po_number: z.string().max(50).optional(),
        client_doc_id: z.string().uuid().optional(),
      })
      .optional()
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("items_purchased")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      if (data.lead_reference) q = q.eq("lead_reference", data.lead_reference);
      if (data.po_number) q = q.eq("po_number", data.po_number);
      if (data.client_doc_id) q = q.eq("client_doc_id", data.client_doc_id);
    }

    const { data: items, error } = await q;
    if (error) throw new Error(error.message);
    return (items ?? []) as any[];
  });
