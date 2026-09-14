import type { Database, Tables, TablesInsert } from "@/integrations/supabase/types";

// ── Money helpers ──────────────────────────────────────────────
// All money stored as INTEGER cents (PHP). 100 cents = ₱1.00
// Never use floating-point arithmetic for financial values.

export type Cents = number;
export type Peso = number; // display value (float for UI only, never computed with)

/** Convert PHP pesos to cents (integer). Safe for positive values. */
export function toCents(peso: Peso): Cents {
  if (peso < 0) throw new Error("Negative money not allowed");
  return Math.round(peso * 100);
}

/** Convert cents to pesos (display only). */
export function fromCents(cents: Cents): Peso {
  return cents / 100;
}

/** Format cents as Philippine Peso string: ₱1,234.56 */
export function formatCents(cents: Cents): string {
  if (cents === 0) return "₱0.00";
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const pesos = Math.floor(abs / 100);
  const centavos = abs % 100;
  return `${sign}₱${pesos.toLocaleString("en-PH")}.${centavos.toString().padStart(2, "0")}`;
}

/** Sum cents values (integer-safe). Returns 0 for empty. */
export function sumCents(values: Cents[]): Cents {
  return values.reduce((s, v) => s + v, 0);
}

/** Money record shape used across operational tables */
export interface MoneyRecord {
  total_cents: Cents;
  paid_cents: Cents;
  balance_cents: Cents;
}

/** Compute balance deterministically. NEVER let LLM compute this. */
export function computeBalance(totalCents: Cents, paidCents: Cents): Cents {
  return totalCents - paidCents;
}

// ── Operational status constants ───────────────────────────────

export const INVOICE_STATUS = {
  DRAFT: "draft",
  ISSUED: "issued",
  PARTIALLY_PAID: "partially-paid",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
} as const;

export const PROJECT_STAGE = {
  PROSPECT: "prospect",
  PO_RECEIVED: "po-received",
  PROCUREMENT_SHIPPING: "procurement-shipping",
  FABRICATION: "fabrication",
  DELIVERY_INSTALLATION: "delivery-installation",
  BILLING_COLLECTION: "billing-collection",
  COMPLETED: "completed",
} as const;

export const TP_MILESTONE = {
  MILESTONE_1: "1st Payment (40%)",
  MILESTONE_2: "2nd Payment (30%)",
  MILESTONE_3: "3rd Payment (30%)",
} as const;

// ── Typed table accessors ──────────────────────────────────────

export type CustomerRow = Tables<"customers">;
export type ProjectRow = Tables<"projects">;
export type ClientPORow = Tables<"client_po">;
export type POLineItemRow = Tables<"po_line_items">;
export type InvoiceRow = Tables<"invoices">;
export type InvoiceLineItemRow = Tables<"invoice_line_items">;
export type PaymentRow = Tables<"payments">;
export type SupplierRow = Tables<"suppliers">;
export type SupplierPORow = Tables<"supplier_po">;
export type ProjectCostRow = Tables<"project_costs">;

export type CustomerInsert = TablesInsert<"customers">;
export type ProjectInsert = TablesInsert<"projects">;
export type ClientPOInsert = TablesInsert<"client_po">;
export type POLineItemInsert = TablesInsert<"po_line_items">;
export type InvoiceInsert = TablesInsert<"invoices">;
export type InvoiceLineItemInsert = TablesInsert<"invoice_line_items">;
export type PaymentInsert = TablesInsert<"payments">;
export type SupplierInsert = TablesInsert<"suppliers">;
export type SupplierPOInsert = TablesInsert<"supplier_po">;
export type ProjectCostInsert = TablesInsert<"project_costs">;
