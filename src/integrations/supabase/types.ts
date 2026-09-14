export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      client_docs: {
        Row: {
          created_at: string
          document_type: string
          file_mime: string
          file_name: string
          file_size_bytes: number
          file_url: string
          id: string
          lead_reference: string | null
          notes: string | null
          po_number: string | null
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_mime: string
          file_name: string
          file_size_bytes: number
          file_url: string
          id?: string
          lead_reference?: string | null
          notes?: string | null
          po_number?: string | null
          storage_path: string
          updated_at?: string
          uploaded_by?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_mime?: string
          file_name?: string
          file_size_bytes?: number
          file_url?: string
          id?: string
          lead_reference?: string | null
          notes?: string | null
          po_number?: string | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      client_po: {
        Row: {
          created_at: string
          documents: Json | null
          id: string
          invoiced_cents: number
          issued_date: string | null
          milestone1_invoiced: boolean
          milestone2_invoiced: boolean
          milestone3_invoiced: boolean
          notes: string | null
          po_number: string
          project_id: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          documents?: Json | null
          id?: string
          invoiced_cents?: number
          issued_date?: string | null
          milestone1_invoiced?: boolean
          milestone2_invoiced?: boolean
          milestone3_invoiced?: boolean
          notes?: string | null
          po_number: string
          project_id: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          documents?: Json | null
          id?: string
          invoiced_cents?: number
          issued_date?: string | null
          milestone1_invoiced?: boolean
          milestone2_invoiced?: boolean
          milestone3_invoiced?: boolean
          notes?: string | null
          po_number?: string
          project_id?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_po_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          lead_source: string | null
          name: string
          notes: string | null
          phone: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_source?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_source?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          aluminum_system: string | null
          created_at: string
          description: string
          discount_cents: number
          glass_thickness_mm: number | null
          glass_type: string | null
          id: string
          invoice_id: string
          line_total_cents: number
          product_type: string | null
          quantity: number
          remarks: string | null
          sort_order: number
          tax_cents: number
          unit: string
          unit_price_cents: number
        }
        Insert: {
          aluminum_system?: string | null
          created_at?: string
          description: string
          discount_cents?: number
          glass_thickness_mm?: number | null
          glass_type?: string | null
          id?: string
          invoice_id: string
          line_total_cents: number
          product_type?: string | null
          quantity?: number
          remarks?: string | null
          sort_order?: number
          tax_cents?: number
          unit?: string
          unit_price_cents?: number
        }
        Update: {
          aluminum_system?: string | null
          created_at?: string
          description?: string
          discount_cents?: number
          glass_thickness_mm?: number | null
          glass_type?: string | null
          id?: string
          invoice_id?: string
          line_total_cents?: number
          product_type?: string | null
          quantity?: number
          remarks?: string | null
          sort_order?: number
          tax_cents?: number
          unit?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_number_seq: {
        Row: {
          id: number
          last_number: number
        }
        Insert: {
          id?: number
          last_number?: number
        }
        Update: {
          id?: number
          last_number?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_paid_cents: number
          billing_milestone: string | null
          client_po_id: string | null
          created_at: string
          customer_id: string
          discount_cents: number
          documents: Json | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          payment_terms: string | null
          project_id: string
          status: string
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          amount_paid_cents?: number
          billing_milestone?: string | null
          client_po_id?: string | null
          created_at?: string
          customer_id: string
          discount_cents?: number
          documents?: Json | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          payment_terms?: string | null
          project_id: string
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Update: {
          amount_paid_cents?: number
          billing_milestone?: string | null
          client_po_id?: string | null
          created_at?: string
          customer_id?: string
          discount_cents?: number
          documents?: Json | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          payment_terms?: string | null
          project_id?: string
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "client_po"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      items_purchased: {
        Row: {
          class_name: string | null
          client_doc_id: string | null
          created_at: string
          description: string
          id: string
          lead_reference: string | null
          po_number: string | null
          project_name: string | null
          quantity: number
          total_cents: number
          unit: string
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          class_name?: string | null
          client_doc_id?: string | null
          created_at?: string
          description: string
          id?: string
          lead_reference?: string | null
          po_number?: string | null
          project_name?: string | null
          quantity?: number
          total_cents: number
          unit?: string
          unit_price_cents: number
          updated_at?: string
        }
        Update: {
          class_name?: string | null
          client_doc_id?: string | null
          created_at?: string
          description?: string
          id?: string
          lead_reference?: string | null
          po_number?: string | null
          project_name?: string | null
          quantity?: number
          total_cents?: number
          unit?: string
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_purchased_client_doc_id_fkey"
            columns: ["client_doc_id"]
            isOneToOne: false
            referencedRelation: "client_docs"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          by: string
          description: string
          id: string
          lead_id: string
          occurred_at: string
          type: string
        }
        Insert: {
          by: string
          description: string
          id?: string
          lead_id: string
          occurred_at?: string
          type: string
        }
        Update: {
          by?: string
          description?: string
          id?: string
          lead_id?: string
          occurred_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          budget_range: string | null
          company_name: string | null
          contact_name: string
          contact_role: string | null
          created_at: string
          customer_type: string
          customer_type_label: string
          email: string | null
          estimated_completion_date: string | null
          estimated_start_date: string | null
          id: string
          last_activity_at: string
          lead_reference: string
          notes: string | null
          owner_id: string | null
          phone: string | null
          project_description: string | null
          project_location: string | null
          project_name: string | null
          project_type: string | null
          score: number
          signals: string[] | null
          source: string
          source_url: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          company_name?: string | null
          contact_name: string
          contact_role?: string | null
          created_at?: string
          customer_type: string
          customer_type_label: string
          email?: string | null
          estimated_completion_date?: string | null
          estimated_start_date?: string | null
          id?: string
          last_activity_at?: string
          lead_reference: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          project_description?: string | null
          project_location?: string | null
          project_name?: string | null
          project_type?: string | null
          score?: number
          signals?: string[] | null
          source?: string
          source_url?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          company_name?: string | null
          contact_name?: string
          contact_role?: string | null
          created_at?: string
          customer_type?: string
          customer_type_label?: string
          email?: string | null
          estimated_completion_date?: string | null
          estimated_start_date?: string | null
          id?: string
          last_activity_at?: string
          lead_reference?: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          project_description?: string | null
          project_location?: string | null
          project_name?: string | null
          project_type?: string | null
          score?: number
          signals?: string[] | null
          source?: string
          source_url?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          confirmed: boolean
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          payment_number: string
          reference: string | null
        }
        Insert: {
          amount_cents: number
          confirmed?: boolean
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_number: string
          reference?: string | null
        }
        Update: {
          amount_cents?: number
          confirmed?: boolean
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_number?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      po_line_items: {
        Row: {
          aluminum_system: string | null
          client_po_id: string
          created_at: string
          description: string
          discount_cents: number
          glass_thickness_mm: number | null
          glass_type: string | null
          id: string
          line_total_cents: number
          product_type: string | null
          quantity: number
          remarks: string | null
          sort_order: number
          tax_cents: number
          unit: string
          unit_price_cents: number
        }
        Insert: {
          aluminum_system?: string | null
          client_po_id: string
          created_at?: string
          description: string
          discount_cents?: number
          glass_thickness_mm?: number | null
          glass_type?: string | null
          id?: string
          line_total_cents: number
          product_type?: string | null
          quantity?: number
          remarks?: string | null
          sort_order?: number
          tax_cents?: number
          unit?: string
          unit_price_cents?: number
        }
        Update: {
          aluminum_system?: string | null
          client_po_id?: string
          created_at?: string
          description?: string
          discount_cents?: number
          glass_thickness_mm?: number | null
          glass_type?: string | null
          id?: string
          line_total_cents?: number
          product_type?: string | null
          quantity?: number
          remarks?: string | null
          sort_order?: number
          tax_cents?: number
          unit?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "po_line_items_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "client_po"
            referencedColumns: ["id"]
          },
        ]
      }
      project_costs: {
        Row: {
          amount_cents: number
          confirmed: boolean
          cost_category: string
          created_at: string
          description: string | null
          id: string
          incurred_date: string | null
          is_commitment: boolean
          notes: string | null
          project_id: string
          supplier_po_id: string | null
        }
        Insert: {
          amount_cents: number
          confirmed?: boolean
          cost_category?: string
          created_at?: string
          description?: string | null
          id?: string
          incurred_date?: string | null
          is_commitment?: boolean
          notes?: string | null
          project_id: string
          supplier_po_id?: string | null
        }
        Update: {
          amount_cents?: number
          confirmed?: boolean
          cost_category?: string
          created_at?: string
          description?: string | null
          id?: string
          incurred_date?: string | null
          is_commitment?: boolean
          notes?: string | null
          project_id?: string
          supplier_po_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_costs_supplier_po_id_fkey"
            columns: ["supplier_po_id"]
            isOneToOne: false
            referencedRelation: "supplier_po"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_costs_cents: number
          actual_margin_cents: number
          committed_procurement_cents: number
          created_at: string
          customer_id: string
          description: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          po_value_cents: number
          projected_margin_cents: number
          stage: string
          updated_at: string
        }
        Insert: {
          actual_costs_cents?: number
          actual_margin_cents?: number
          committed_procurement_cents?: number
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          po_value_cents?: number
          projected_margin_cents?: number
          stage?: string
          updated_at?: string
        }
        Update: {
          actual_costs_cents?: number
          actual_margin_cents?: number
          committed_procurement_cents?: number
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          po_value_cents?: number
          projected_margin_cents?: number
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_conversions: {
        Row: {
          converted_at: string
          converted_by: string
          customer_id: string
          customer_name: string
          id: string
          lead_id: string
          notes: string | null
          project_id: string | null
          project_name: string | null
          quote_id: string | null
          quote_reference: string | null
        }
        Insert: {
          converted_at?: string
          converted_by: string
          customer_id: string
          customer_name: string
          id?: string
          lead_id: string
          notes?: string | null
          project_id?: string | null
          project_name?: string | null
          quote_id?: string | null
          quote_reference?: string | null
        }
        Update: {
          converted_at?: string
          converted_by?: string
          customer_id?: string
          customer_name?: string
          id?: string
          lead_id?: string
          notes?: string | null
          project_id?: string | null
          project_name?: string | null
          quote_id?: string | null
          quote_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_conversions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_conversions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_conversions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_conversions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_number_seq: {
        Row: {
          id: number
          last_number: number
        }
        Insert: {
          id?: number
          last_number?: number
        }
        Update: {
          id?: number
          last_number?: number
        }
        Relationships: []
      }
      quote_systems: {
        Row: {
          aluminum_system: string | null
          configuration: string | null
          created_at: string
          finish: string | null
          glass_color: string | null
          glass_thickness_mm: number | null
          glass_type: string | null
          hardware: string | null
          height_mm: number | null
          id: string
          installation: string | null
          location: string | null
          notes: string | null
          quantity: number
          quote_id: string
          screens: string | null
          system_key: string
          unit: string | null
          width_mm: number | null
        }
        Insert: {
          aluminum_system?: string | null
          configuration?: string | null
          created_at?: string
          finish?: string | null
          glass_color?: string | null
          glass_thickness_mm?: number | null
          glass_type?: string | null
          hardware?: string | null
          height_mm?: number | null
          id?: string
          installation?: string | null
          location?: string | null
          notes?: string | null
          quantity?: number
          quote_id: string
          screens?: string | null
          system_key: string
          unit?: string | null
          width_mm?: number | null
        }
        Update: {
          aluminum_system?: string | null
          configuration?: string | null
          created_at?: string
          finish?: string | null
          glass_color?: string | null
          glass_thickness_mm?: number | null
          glass_type?: string | null
          hardware?: string | null
          height_mm?: number | null
          id?: string
          installation?: string | null
          location?: string | null
          notes?: string | null
          quantity?: number
          quote_id?: string
          screens?: string | null
          system_key?: string
          unit?: string | null
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_systems_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          prepared_at: string
          prepared_by: string
          project_id: string | null
          quote_reference: string
          status: string
          total_cents: number
          updated_at: string
          validity_days: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          prepared_at?: string
          prepared_by: string
          project_id?: string | null
          quote_reference: string
          status?: string
          total_cents?: number
          updated_at?: string
          validity_days?: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          prepared_at?: string
          prepared_by?: string
          project_id?: string | null
          quote_reference?: string
          status?: string
          total_cents?: number
          updated_at?: string
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          data: Json
          id: string
          updated_at: string
        }
        Insert: {
          data: Json
          id: string
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_po: {
        Row: {
          created_at: string
          documents: Json | null
          id: string
          notes: string | null
          po_date: string | null
          po_number: string
          project_id: string | null
          shipping_cents: number
          status: string
          subtotal_cents: number
          supplier_id: string
          total_cents: number
          updated_at: string
          vat_cents: number
        }
        Insert: {
          created_at?: string
          documents?: Json | null
          id?: string
          notes?: string | null
          po_date?: string | null
          po_number: string
          project_id?: string | null
          shipping_cents?: number
          status?: string
          subtotal_cents?: number
          supplier_id: string
          total_cents?: number
          updated_at?: string
          vat_cents?: number
        }
        Update: {
          created_at?: string
          documents?: Json | null
          id?: string
          notes?: string | null
          po_date?: string | null
          po_number?: string
          project_id?: string | null
          shipping_cents?: number
          status?: string
          subtotal_cents?: number
          supplier_id?: string
          total_cents?: number
          updated_at?: string
          vat_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_po_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_po_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      invoice_balances: {
        Row: {
          balance_cents: number | null
          id: string | null
          invoice_number: string | null
          paid_cents: number | null
          total_cents: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      mark_overdue_invoices: { Args: never; Returns: undefined }
      next_invoice_number: { Args: never; Returns: string }
      next_quote_number: { Args: never; Returns: string }
      quote_completion_check: { Args: { v_quote_id: string }; Returns: Json }
      total_items_value: {
        Args: { p_lead_reference: string; p_po_number: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
