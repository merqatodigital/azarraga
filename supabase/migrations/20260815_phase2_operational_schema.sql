-- ============================================================
-- Azarraga Glass & Aluminum — Phase 2 Operational Schema
-- Target: Supabase project zmqtdiukbmygfazjtxoi (public schema)
-- Prepared for: David — execute in Supabase SQL Editor
-- Status: READY FOR REVIEW
-- ============================================================
-- This script creates the financial/operational tables that
-- support: customers, projects, client POs, invoice lifecycle,
-- payments, suppliers, and project cost tracking.
--
-- ALL monetary values are stored as INTEGER (cents, PHP).
-- 100 cents = ₱1.00
-- Never use floating-point arithmetic for money.
--
-- Invoice numbers: AZ-00001, AZ-00002, ... via DB sequence.
-- Invoice balance = total_cents - SUM(payments.paid_cents).
-- Never let an LLM calculate or invent financial balances.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  address text,
  city text,
  region text DEFAULT 'Palawan',
  notes text,
  lead_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage all customer records
CREATE POLICY "customers_all" ON public.customers
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 2. PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  location text,
  stage text NOT NULL DEFAULT 'prospect'
    CHECK (stage IN (
      'prospect', 'po-received', 'procurement-shipping',
      'fabrication', 'delivery-installation', 'billing-collection', 'completed'
    )),
  po_value_cents integer NOT NULL DEFAULT 0,
  projected_margin_cents integer NOT NULL DEFAULT 0,
  actual_margin_cents integer NOT NULL DEFAULT 0,
  committed_procurement_cents integer NOT NULL DEFAULT 0,
  actual_costs_cents integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_all" ON public.projects
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_projects_customer ON public.projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_stage ON public.projects(stage);

-- ============================================================
-- 3. CLIENT PURCHASE ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.client_po (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  issued_date date,
  total_cents integer NOT NULL DEFAULT 0,
  invoiced_cents integer NOT NULL DEFAULT 0,
  milestone1_invoiced boolean NOT NULL DEFAULT false,
  milestone2_invoiced boolean NOT NULL DEFAULT false,
  milestone3_invoiced boolean NOT NULL DEFAULT false,
  notes text,
  documents jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_client_po_project_po_number UNIQUE (project_id, po_number)
);

ALTER TABLE public.client_po ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_po_all" ON public.client_po
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_client_po_project ON public.client_po(project_id);
CREATE INDEX IF NOT EXISTS idx_client_po_po_number ON public.client_po(po_number);

-- ============================================================
-- 4. PO LINE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.po_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_po_id uuid NOT NULL REFERENCES public.client_po(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  description text NOT NULL,
  product_type text,
  glass_type text,
  glass_thickness_mm integer,
  aluminum_system text,
  quantity integer NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'pcs',
  unit_price_cents integer NOT NULL DEFAULT 0,
  discount_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  line_total_cents integer NOT NULL,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.po_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_line_items_all" ON public.po_line_items
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_po_line_items_po ON public.po_line_items(client_po_id);

-- ============================================================
-- 5. INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  client_po_id uuid REFERENCES public.client_po(id) ON DELETE SET NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'partially-paid', 'paid', 'overdue', 'cancelled')),
  billing_milestone text,
  subtotal_cents integer NOT NULL DEFAULT 0,
  discount_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  amount_paid_cents integer NOT NULL DEFAULT 0,
  notes text,
  payment_terms text,
  documents jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_invoices_number UNIQUE (invoice_number),
  CONSTRAINT chk_invoice_money CHECK (
    total_cents = COALESCE(subtotal_cents, 0)
      - COALESCE(discount_cents, 0)
      + COALESCE(tax_cents, 0)
  )
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_all" ON public.invoices
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_inv_num ON public.invoices(invoice_number);

-- Balance is NEVER stored. Computed deterministically from total - payments.
-- This view is for convenience; server functions compute the balance directly.
CREATE OR REPLACE VIEW public.invoice_balances AS
SELECT
  i.id,
  i.invoice_number,
  i.total_cents,
  COALESCE(SUM(p.paid_cents), 0) AS paid_cents,
  i.total_cents - COALESCE(SUM(p.paid_cents), 0) AS balance_cents
FROM public.invoices i
LEFT JOIN public.payments p ON p.invoice_id = i.id
WHERE i.status <> 'cancelled'
GROUP BY i.id, i.invoice_number, i.total_cents;

-- ============================================================
-- 6. INVOICE LINE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  description text NOT NULL,
  product_type text,
  glass_type text,
  glass_thickness_mm integer,
  aluminum_system text,
  quantity integer NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'pcs',
  unit_price_cents integer NOT NULL DEFAULT 0,
  discount_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  line_total_cents integer NOT NULL,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_line_items_all" ON public.invoice_line_items
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_inv_line_items_inv ON public.invoice_line_items(invoice_id);

-- ============================================================
-- 7. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_number text NOT NULL,
  amount_cents integer NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  reference text,
  notes text,
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_payments_inv_num UNIQUE (invoice_id, payment_number),
  CONSTRAINT chk_payment_positive CHECK (amount_cents > 0)
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_all" ON public.payments
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);

-- Trigger: recompute invoice amount_paid_cents + status after payment changes
CREATE OR REPLACE FUNCTION public.recompute_invoice_paid()
RETURNS TRIGGER AS $$
DECLARE
  v_inv_id uuid;
  v_paid integer;
  v_total integer;
  v_status text;
BEGIN
  -- Determine which invoice to recompute
  IF TG_OP = 'DELETE' THEN
    v_inv_id := OLD.invoice_id;
  ELSE
    v_inv_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  END IF;

  IF v_inv_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT i.total_cents INTO v_total
  FROM public.invoices i
  WHERE i.id = v_inv_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(p.amount_cents), 0)
  INTO v_paid
  FROM public.payments p
  WHERE p.invoice_id = v_inv_id
  AND p.confirmed = true;

  UPDATE public.invoices
  SET amount_paid_cents = v_paid
  WHERE id = v_inv_id;

  -- Recompute status
  IF v_total <= 0 THEN
    v_status := 'paid';
  ELSIF v_paid >= v_total THEN
    v_status := 'paid';
  ELSIF v_paid > 0 THEN
    v_status := 'partially-paid';
  ELSE
    v_status := 'issued';
  END IF;

  -- Overdue check: if status is issued/partially-paid and due date has passed
  IF v_status IN ('issued', 'partially-paid') THEN
    SELECT due_date INTO STRICT v_due_date FROM public.invoices WHERE id = v_inv_id;
    IF v_due_date IS NOT NULL AND v_due_date < CURRENT_DATE THEN
      v_status := 'overdue';
    END IF;
  END IF;

  UPDATE public.invoices
  SET status = v_status, updated_at = now()
  WHERE id = v_inv_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recompute_invoice_paid
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.recompute_invoice_paid();

-- ============================================================
-- 8. SUPPLIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_all" ON public.suppliers
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 9. SUPPLIER PURCHASE ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.supplier_po (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  po_number text NOT NULL,
  po_date date,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'placed', 'shipped', 'delivered', 'paid', 'cancelled')),
  subtotal_cents integer NOT NULL DEFAULT 0,
  vat_cents integer NOT NULL DEFAULT 0,
  shipping_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  notes text,
  documents jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uk_supplier_po_supplier_po_number UNIQUE (supplier_id, po_number)
);

ALTER TABLE public.supplier_po ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplier_po_all" ON public.supplier_po
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_supplier_po_supplier ON public.supplier_po(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_po_project ON public.supplier_po(project_id);

-- ============================================================
-- 10. PROJECT COSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  supplier_po_id uuid REFERENCES public.supplier_po(id) ON DELETE SET NULL,
  cost_category text NOT NULL DEFAULT 'materials'
    CHECK (cost_category IN ('materials', 'shipping', 'labor', 'overhead', 'other')),
  description text,
  amount_cents integer NOT NULL,
  incurred_date date,
  is_commitment boolean NOT NULL DEFAULT false,
  confirmed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_costs_all" ON public.project_costs
  FOR ALL TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_proj_costs_project ON public.project_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_costs_supplier ON public.project_costs(supplier_po_id);

-- Trigger: recompute project committed/actual costs after cost changes
CREATE OR REPLACE FUNCTION public.recompute_project_costs()
RETURNS TRIGGER AS $$
DECLARE
  v_proj_id uuid;
  v_committed integer;
  v_actual integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_proj_id := OLD.project_id;
  ELSE
    v_proj_id := COALESCE(NEW.project_id, OLD.project_id);
  END IF;

  IF v_proj_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(pc.amount_cents), 0)
  INTO v_committed
  FROM public.project_costs pc
  WHERE pc.project_id = v_proj_id
  AND pc.is_commitment = true;

  SELECT COALESCE(SUM(pc.amount_cents), 0)
  INTO v_actual
  FROM public.project_costs pc
  WHERE pc.project_id = v_proj_id
  AND pc.confirmed = true;

  UPDATE public.projects
  SET committed_procurement_cents = v_committed,
      actual_costs_cents = v_actual,
      updated_at = now()
  WHERE id = v_proj_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recompute_project_costs
  AFTER INSERT OR UPDATE OR DELETE ON public.project_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.recompute_project_costs();

-- ============================================================
-- 11. INVOICE NUMBER GENERATION FUNCTION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoice_number_seq (
  id integer PRIMARY KEY DEFAULT 1,
  last_number integer NOT NULL DEFAULT 0
);

-- Initialize if empty
INSERT INTO public.invoice_number_seq (id, last_number)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS text AS $$
DECLARE
  v_next integer;
  v_formatted text;
BEGIN
  -- Atomically increment and return the next number
  UPDATE public.invoice_number_seq
  SET last_number = last_number + 1
  WHERE id = 1
  RETURNING last_number INTO v_next;

  v_formatted := 'AZ-' || lpad(v_next::text, 5, '0');
  RETURN v_formatted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 12. HELPER: OVERDUE INVOICE MARKER (called by cron later)
-- ============================================================
-- This function can be called by a Cloudflare Cron Trigger to
-- mark invoices as overdue when their due date has passed.
-- For now, the recompute_invoice_paid() trigger handles it
-- when payments are recorded. This is a secondary safety net.
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE public.invoices
  SET status = 'overdue', updated_at = now()
  WHERE status IN ('issued', 'partially-paid')
    AND due_date IS NOT NULL
    AND due_date < CURRENT_DATE
    AND amount_paid_cents < total_cents;
END;
$$ LANGUAGE plpgsql;

COMMIT;
