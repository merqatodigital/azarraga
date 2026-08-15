-- ============================================================
-- Azarraga Phase 3 — TALA Business Knowledge: Leads + Quotes
-- Target: Supabase project zmqtdiukbmygfazjtxoi (public schema)
-- Prepared for: David — execute in Supabase SQL Editor
-- Status: READY FOR REVIEW
-- ============================================================

BEGIN;

-- ============================================================
-- 1. LEADS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_reference text NOT NULL,
  source text NOT NULL DEFAULT 'unknown',
  source_url text,
  customer_type text NOT NULL,
  customer_type_label text NOT NULL,
  company_name text,
  contact_name text NOT NULL,
  contact_role text,
  phone text,
  email text,
  project_name text,
  project_description text,
  project_location text,
  estimated_start_date date,
  estimated_completion_date date,
  budget_range text,
  project_type text,
  signals text[],
  stage text NOT NULL DEFAULT 'new'
    CHECK (stage IN ('new','contacted','qualified','proposing','negotiating','converted','lost','stalled')),
  score integer NOT NULL DEFAULT 0,
  notes text,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_all" ON public.leads
  FOR ALL TO "authenticated"
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_customer_type ON public.leads(customer_type);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_reference ON public.leads(lead_reference);

-- ============================================================
-- 2. LEAD ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  by text NOT NULL
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_activities_all" ON public.lead_activities
  FOR ALL TO "authenticated"
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities(lead_id);

-- ============================================================
-- 3. QUOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_reference text NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  total_cents integer NOT NULL DEFAULT 0,
  prepared_at timestamptz NOT NULL DEFAULT now(),
  prepared_by text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','awaiting-specs','ready-for-approval','approved','issued','converted-to-p_o')),
  validity_days integer NOT NULL DEFAULT 30,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes_all" ON public.quotes
  FOR ALL TO "authenticated"
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_quotes_customer ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_project ON public.quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_reference ON public.quotes(quote_reference);

-- ============================================================
-- 4. QUOTE SYSTEMS (quote line items — glass/aluminum systems)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quote_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  system_key text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  width_mm integer,
  height_mm integer,
  unit text,
  configuration text,
  glass_type text,
  glass_thickness_mm integer,
  glass_color text,
  aluminum_system text,
  finish text,
  hardware text,
  screens text,
  installation text,
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quote_systems_all" ON public.quote_systems
  FOR ALL TO "authenticated"
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_quote_systems_quote ON public.quote_systems(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_systems_system ON public.quote_systems(system_key);

-- ============================================================
-- 5. QUOTE CONVERSIONS (lead → customer/project/quote)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quote_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,
  converted_at timestamptz NOT NULL DEFAULT now(),
  converted_by text NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  customer_name text NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name text,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  quote_reference text,
  notes text
);

ALTER TABLE public.quote_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quote_conversions_all" ON public.quote_conversions
  FOR ALL TO "authenticated"
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_quote_conversions_lead ON public.quote_conversions(lead_id);
CREATE INDEX IF NOT EXISTS idx_quote_conversions_customer ON public.quote_conversions(customer_id);

-- ============================================================
-- 6. QUOTE NUMBER SEQUENCE + FUNCTION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quote_number_seq (
  id integer PRIMARY KEY DEFAULT 1,
  last_number integer NOT NULL DEFAULT 0
);

INSERT INTO public.quote_number_seq (id, last_number)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.next_quote_number()
RETURNS text AS $$
DECLARE
  v_next integer;
  v_year integer;
  v_formatted text;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  UPDATE public.quote_number_seq
    SET last_number = last_number + 1
    WHERE id = 1
    RETURNING last_number INTO v_next;
  v_formatted := 'Q-' || v_year || '-' || lpad(v_next::text, 3, '0');
  RETURN v_formatted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. VALIDATION HELPER: quote completeness check
-- ============================================================
-- Returns a JSON summary of missing specs for a quote.
-- TALA calls this to decide if a quote is ready for owner approval.
CREATE OR REPLACE FUNCTION public.quote_completion_check(v_quote_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_missing jsonb;
BEGIN
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'system_key', qs.system_key,
        'field', missing_fields.field,
        'label', missing_fields.label,
        'reason', missing_fields.reason
      )
    ) FILTER (WHERE true),
    '[]'
  ) INTO v_missing
  FROM public.quote_systems qs
  CROSS JOIN LATERAL (
    SELECT missing_specs.field, missing_specs.label, missing_specs.reason
    FROM (
      -- quantity check
      SELECT 'quantity' AS field, 'Quantity' AS label,
        'Quantity is required' AS reason
      WHERE qs.quantity IS NULL OR qs.quantity <= 0
      UNION ALL
      -- location check
      SELECT 'location' AS field, 'Location' AS label,
        'Installation location is required' AS reason
      WHERE qs.location IS NULL OR trim(qs.location) = ''
      UNION ALL
      -- glass_type check (for glass systems)
      SELECT 'glass_type' AS field, 'Glass Type' AS label,
        'Glass type must be specified' AS reason
      WHERE qs.glass_type IS NULL OR trim(qs.glass_type) = ''
      UNION ALL
      -- glass_thickness check
      SELECT 'glass_thickness' AS field, 'Glass Thickness' AS label,
        'Glass thickness required' AS reason
      WHERE qs.glass_thickness_mm IS NULL OR qs.glass_thickness_mm <= 0
      UNION ALL
      -- configuration check (for configured systems)
      SELECT 'configuration' AS field, 'Configuration / Panels' AS label,
        'Configuration is required' AS reason
      WHERE qs.configuration IS NULL OR trim(qs.configuration) = ''
      UNION ALL
      -- aluminum_system check
      SELECT 'aluminum_system' AS field, 'Aluminum System' AS label,
        'Aluminum system must be specified' AS reason
      WHERE qs.aluminum_system IS NULL OR trim(qs.aluminum_system) = ''
    ) AS missing_specs
  ) AS missing_fields
  WHERE qs.quote_id = v_quote_id;

  RETURN v_missing;
END;
$$ LANGUAGE plpgsql;

COMMIT;
