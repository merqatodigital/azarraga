import type { Database, Tables } from "@/integrations/supabase/types";

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

export type CustomerRow = Tables<"public", "customers">["Row"];
export type ProjectRow = Tables<"public", "projects">["Row"];
export type ClientPORow = Tables<"public", "client_po">["Row"];
export type POLineItemRow = Tables<"public", "po_line_items">["Row"];
export type InvoiceRow = Tables<"public", "invoices">["Row"];
export type InvoiceLineItemRow = Tables<"public", "invoice_line_items">["Row"];
export type PaymentRow = Tables<"public", "payments">["Row"];
export type SupplierRow = Tables<"public", "suppliers">["Row"];
export type SupplierPORow = Tables<"public", "supplier_po">["Row"];
export type ProjectCostRow = Tables<"public", "project_costs">["Row"];

export type CustomerInsert = Tables<"public", "customers">["Insert"];
export type ProjectInsert = Tables<"public", "projects">["Insert"];
export type ClientPOInsert = Tables<"public", "client_po">["Insert"];
export type POLineItemInsert = Tables<"public", "po_line_items">["Insert"];
export type InvoiceInsert = Tables<"public", "invoices">["Insert"];
export type InvoiceLineItemInsert = Tables<"public", "invoice_line_items">["Insert"];
export type PaymentInsert = Tables<"public", "payments">["Insert"];
export type SupplierInsert = Tables<"public", "suppliers">["Insert"];
export type SupplierPOInsert = Tables<"public", "supplier_po">["Insert"];
export type ProjectCostInsert = Tables<"public", "project_costs">["Insert"];
