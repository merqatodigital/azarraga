export type TalaToolRisk = "read" | "safe_write" | "approval_required";

export type TalaToolDefinition = {
  name: string;
  description: string;
  risk: TalaToolRisk;
};

/**
 * Stable business-tool contract for TALA.
 * Implementations are attached to Supabase only after the owner runs the approved SQL.
 * Keeping this contract separate prevents the model from receiving arbitrary database access.
 */
export const TALA_TOOLS: readonly TalaToolDefinition[] = [
  { name: "get_daily_brief", description: "Read today's leads, follow-ups, projects, collections, payments and tasks.", risk: "read" },
  { name: "list_new_leads", description: "Read new Azarraga leads.", risk: "read" },
  { name: "list_followups_due", description: "Read follow-ups that are due.", risk: "read" },
  { name: "search_customers", description: "Search customer records.", risk: "read" },
  { name: "search_projects", description: "Search project records.", risk: "read" },
  { name: "get_project", description: "Read a project and its operational history.", risk: "read" },
  { name: "list_receivables", description: "Read deterministic invoice balances and collection status.", risk: "read" },
  { name: "get_invoice", description: "Read an invoice and confirmed payments.", risk: "read" },
  { name: "search_documents", description: "Search project and financial documents.", risk: "read" },
  { name: "create_lead", description: "Create a new lead record.", risk: "safe_write" },
  { name: "update_lead_stage", description: "Move a lead through the sales pipeline.", risk: "safe_write" },
  { name: "create_task", description: "Create an owner follow-up or operational task.", risk: "safe_write" },
  { name: "complete_task", description: "Mark an existing task complete.", risk: "safe_write" },
  { name: "attach_document", description: "Associate an uploaded document with a business record.", risk: "safe_write" },
  { name: "create_quote_draft", description: "Prepare, but do not issue, a quotation draft from approved source data.", risk: "approval_required" },
  { name: "issue_quote", description: "Issue an owner-approved quotation.", risk: "approval_required" },
  { name: "create_invoice_draft", description: "Prepare, but do not issue, an invoice draft from approved source data.", risk: "approval_required" },
  { name: "issue_invoice", description: "Issue an owner-approved invoice.", risk: "approval_required" },
  { name: "propose_payment", description: "Prepare a payment record for owner verification.", risk: "approval_required" },
  { name: "confirm_payment", description: "Confirm a payment after owner approval.", risk: "approval_required" },
] as const;

export function getToolDefinition(name: string): TalaToolDefinition | undefined {
  return TALA_TOOLS.find((tool) => tool.name === name);
}

export function requiresOwnerApproval(name: string): boolean {
  return getToolDefinition(name)?.risk === "approval_required";
}
