-- ============================================================
-- Azarraga Glass & Aluminum — Client Document Upload System
-- ============================================================
-- Client-facing document upload: POs, quotations, sketches,
-- photos — stored in Supabase and linked to leads/POs.
-- David executes this manually in Supabase SQL Editor.
-- ============================================================

-- 1. CLIENT DOCUMENTS TABLE
-- Stores uploaded documents linked by lead_reference (for
-- quote-request leads) or po_number (for client_po records).
-- No RLS restriction beyond authenticated — admin reads all,
-- clients can only see their own via future RLS if needed.

CREATE TABLE IF NOT EXISTS public.client_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Linking: a document belongs to either a lead or a PO
  lead_reference text,
  po_number text,

  -- What was uploaded
  document_type text NOT NULL
    CHECK (document_type IN (
      'purchase_order',        -- client PO received
      'quotation',             -- quotation sent/received
      'sketch',                -- hand sketch / drawing
      'photo',                 -- site photo
      'contract',              -- signed contract
      'invoice',               -- invoice
      'payment_proof',         -- payment receipt/proof
      'other'                  -- anything else
    )),
  file_name text NOT NULL,
  file_mime text NOT NULL,
  file_size_bytes bigint NOT NULL,
  file_url text NOT NULL,          -- public URL in client-docs bucket
  storage_path text NOT NULL,      -- path in bucket (for admin management)

  -- Context from uploader
  uploaded_by text NOT NULL DEFAULT 'website',  -- 'website' | 'admin' | 'tala'
  notes text,

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_docs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all client documents
CREATE POLICY "client_docs_read_all" ON public.client_docs
  FOR SELECT TO "authenticated" USING (true);

-- Server functions (service role) can do everything
CREATE POLICY "client_docs_service_role" ON public.client_docs
  FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_client_docs_lead_ref
  ON public.client_docs(lead_reference);
CREATE INDEX IF NOT EXISTS idx_client_docs_po_number
  ON public.client_docs(po_number);
CREATE INDEX IF NOT EXISTS idx_client_docs_type
  ON public.client_docs(document_type);
CREATE INDEX IF NOT EXISTS idx_client_docs_created
  ON public.client_docs(created_at);

-- 2. CLIENT DOCS STORAGE BUCKET
-- Separate from site-media. Public read so admin can view
-- uploaded files. Write via service role only.
INSERT INTO storage.buckets (id, name, public)
  VALUES ('client-docs', 'client-docs', true)
  ON CONFLICT (id) DO NOTHING;

-- Allow authenticated to read (view files in browser)
CREATE POLICY "client_docs_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-docs');

-- Service role can do everything
CREATE POLICY "client_docs_service_role" ON storage.objects
  FOR ALL TO "service_role" USING (true) WITH CHECK (true);

-- 3. ITEMS PURCHASED TABLE
-- Tracks what was bought per PO/lead — qty, unit, unit price,
-- description. This is the structured record of what clients
-- ordered, extracted from their POs.

CREATE TABLE IF NOT EXISTS public.items_purchased (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Linking
  lead_reference text,
  po_number text,
  client_doc_id uuid REFERENCES public.client_docs(id) ON DELETE SET NULL,

  -- Item details (from PO line item)
  description text NOT NULL,
  quantity bigint NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'sets',
  unit_price_cents bigint NOT NULL,   -- stored as integer cents (PHP)
  total_cents bigint NOT NULL,        -- quantity * unit_price (cents)

  -- Classification / project tag from PO
  project_name text,
  class_name text,

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.items_purchased ENABLE ROW LEVEL SECURITY;

CREATE POLICY "items_purchased_read_all" ON public.items_purchased
  FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "items_purchased_service_role" ON public.items_purchased
  FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_items_purchased_lead_ref
  ON public.items_purchased(lead_reference);
CREATE INDEX IF NOT EXISTS idx_items_purchased_po_number
  ON public.items_purchased(po_number);
CREATE INDEX IF NOT EXISTS idx_items_purchased_client_doc
  ON public.items_purchased(client_doc_id);

-- 4. HELPER: total items purchased value for a PO/lead
CREATE OR REPLACE FUNCTION public.total_items_value(
  p_po_number text,
  p_lead_reference text
) RETURNS bigint AS $$
DECLARE
  v bigint;
BEGIN
  SELECT COALESCE(SUM(ip.total_cents), 0)
    INTO v
    FROM public.items_purchased ip
   WHERE (p_po_number IS NOT NULL AND ip.po_number = p_po_number)
      OR (p_lead_reference IS NOT NULL AND ip.lead_reference = p_lead_reference);
  RETURN v;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
