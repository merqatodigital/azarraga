import {
  talaGetAlerts,
  talaListOverdueInvoices,
  talaListReceivables,
  talaListProjectsReadyToBill,
  talaListCustomers,
  talaListProjects,
  talaListSuppliers,
  talaListSupplierPOs,
} from "@/lib/tala-tools";

export type TalaOperationalIntent =
  | "alerts"
  | "overdue"
  | "receivables"
  | "billing"
  | "customers"
  | "projects"
  | "suppliers"
  | "supplier_pos"
  | "none";

export function detectOperationalIntent(input: string): TalaOperationalIntent {
  const q = input.toLowerCase();
  if (/overdue|late invoice|past due/.test(q)) return "overdue";
  if (/who owes|receivable|money owed|outstanding/.test(q)) return "receivables";
  if (/ready to bill|needs billing|billing/.test(q)) return "billing";
  if (/supplier po|purchase order|procurement|shipment/.test(q)) return "supplier_pos";
  if (/supplier|vendor/.test(q)) return "suppliers";
  if (/customer|client/.test(q)) return "customers";
  if (/project|job/.test(q)) return "projects";
  if (/attention|alert|today|brief/.test(q)) return "alerts";
  return "none";
}

export async function getOperationalContext(intent: TalaOperationalIntent) {
  switch (intent) {
    case "alerts": return { intent, data: await talaGetAlerts() };
    case "overdue": return { intent, data: await talaListOverdueInvoices() };
    case "receivables": return { intent, data: await talaListReceivables() };
    case "billing": return { intent, data: await talaListProjectsReadyToBill() };
    case "customers": return { intent, data: await talaListCustomers() };
    case "projects": return { intent, data: await talaListProjects() };
    case "suppliers": return { intent, data: await talaListSuppliers() };
    case "supplier_pos": return { intent, data: await talaListSupplierPOs({ data: {} }) };
    default: return { intent: "none" as const, data: null };
  }
}

export function operationalContextPrompt(context: { intent: TalaOperationalIntent; data: unknown }) {
  return `You are TALA, Azarraga Glass & Aluminum's private operations agent.\nThe following JSON came from deterministic Azarraga server tools backed by Supabase. Treat it as business truth. Never invent missing records, amounts, dimensions, payment status, supplier status, or pricing. Financial calculations remain in deterministic server code. If the data is empty, say no matching records were found. Owner approval is mandatory before issuing a quote, invoice, payment action, or external message.\n\nOperational intent: ${context.intent}\nTool result:\n${JSON.stringify(context.data)}`;
}
