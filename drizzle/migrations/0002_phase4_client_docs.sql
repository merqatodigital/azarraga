CREATE TABLE IF NOT EXISTS public.client_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_reference text,
  po_number text,
  document_type text NOT NULL CHECK (document_type IN ('purchase_order','quotation','sketch','photo','contract','invoice','payment_proof','other')),
  file_name text NOT NULL,
  file_mime text NOT NULL,
  file_size_bytes bigint NOT NULL,
  file_url text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by text NOT NULL DEFAULT 'website',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.client_docs TO authenticated;
GRANT ALL ON public.client_docs TO service_role;
ALTER TABLE public.client_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_docs_read_all" ON public.client_docs FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "client_docs_service_role" ON public.client_docs FOR ALL TO "service_role" USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_client_docs_lead_ref ON public.client_docs(lead_reference);
CREATE INDEX IF NOT EXISTS idx_client_docs_po_number ON public.client_docs(po_number);
CREATE INDEX IF NOT EXISTS idx_client_docs_type ON public.client_docs(document_type);
CREATE INDEX IF NOT EXISTS idx_client_docs_created ON public.client_docs(created_at);

CREATE TABLE IF NOT EXISTS public.items_purchased (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_reference text,
  po_number text,
  client_doc_id uuid REFERENCES public.client_docs(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity bigint NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'sets',
  unit_price_cents bigint NOT NULL,
  total_cents bigint NOT NULL,
  project_name text,
  class_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.items_purchased TO authenticated;
GRANT ALL ON public.items_purchased TO service_role;
ALTER TABLE public.items_purchased ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_purchased_read_all" ON public.items_purchased FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "items_purchased_service_role" ON public.items_purchased FOR ALL TO "service_role" USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_items_purchased_lead_ref ON public.items_purchased(lead_reference);
CREATE INDEX IF NOT EXISTS idx_items_purchased_po_number ON public.items_purchased(po_number);
CREATE INDEX IF NOT EXISTS idx_items_purchased_client_doc ON public.items_purchased(client_doc_id);

CREATE OR REPLACE FUNCTION public.total_items_value(p_po_number text, p_lead_reference text) RETURNS bigint AS $$
DECLARE
  v bigint;
BEGIN
  SELECT COALESCE(SUM(ip.total_cents), 0) INTO v
  FROM public.items_purchased ip
  WHERE (p_po_number IS NOT NULL AND ip.po_number = p_po_number)
     OR (p_lead_reference IS NOT NULL AND ip.lead_reference = p_lead_reference);
  RETURN v;
END;
$$ LANGUAGE plpgsql IMMUTABLE;