import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import {
  getLead,
  addLeadActivity,
  listLeadActivities,
  changeLeadStage,
  convertLeadToCustomerProject,
  updateLead,
} from "@/lib/leads.server";
import { listClientDocs } from "@/lib/client-docs.server";
import { LeadRow, LeadActivity, LEAD_STAGE } from "@/lib/lead-knowledge";
import { useState, useEffect, use } from "react";
import { Loader2, Plus, Send, CheckCircle, AlertCircle, Paperclip, Trash2 } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/leads/$id")({
  component: LeadDetailPage,
  loader: async ({ params }) => {
    const lead = await getLead({ data: { id: params.id } });
    const activities = await listLeadActivities({ data: { lead_id: params.id } });
    const docs = await listClientDocs({
      data: { lead_reference: lead.lead_reference },
    });
    return { lead: lead as LeadRow, activities: activities as LeadActivity[], docs };
  },
});

function LeadDetailPage() {
  const params = use(Route.useRouteContext());
  const { lead, activities, docs } = params;

  const [localLead, setLocalLead] = useState(lead);
  const [localActivities, setLocalActivities] = useState(activities);
  const [activityText, setActivityText] = useState("");
  const [activityType, setActivityType] = useState("note");
  const [stageOptions] = useState([
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "proposing", label: "Proposing" },
    { value: "negotiating", label: "Negotiating" },
    { value: "converted", label: "Converted" },
    { value: "lost", label: "Lost" },
    { value: "stalled", label: "Stalled" },
  ]);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertData, setConvertData] = useState({
    customer_id: "",
    customer_name: "",
    project_id: "",
    project_name: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleAddActivity = async () => {
    if (!activityText.trim()) return;
    setSubmitting(true);
    try {
      const activity = await addLeadActivity({
        data: {
          lead_id: localLead.id,
          type: activityType,
          description: activityText,
        },
      });
      setLocalActivities((prev) => [activity as LeadActivity, ...prev]);
      setActivityText("");
    } catch (e) {
      console.error("Failed to add activity:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStageChange = async (stage: string) => {
    try {
      await changeLeadStage({ data: { id: localLead.id, stage } });
      setLocalLead((prev) => ({ ...prev, stage }));
    } catch (e) {
      console.error("Stage change failed:", e);
    }
  };

  const handleConvert = async () => {
    if (!convertData.customer_id || !convertData.customer_name) return;
    setSubmitting(true);
    try {
      await convertLeadToCustomerProject({
        data: {
          lead_id: localLead.id,
          customer_id: convertData.customer_id,
          customer_name: convertData.customer_name,
          project_id: convertData.project_id || undefined,
          project_name: convertData.project_name || undefined,
          notes: convertData.notes || undefined,
        },
      });
      setShowConvertModal(false);
      router.navigate({ to: "/admin/leads" });
    } catch (e) {
      console.error("Conversion failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-700",
      contacted: "bg-purple-100 text-purple-700",
      qualified: "bg-amber-100 text-amber-700",
      proposing: "bg-cyan-100 text-cyan-700",
      negotiating: "bg-orange-100 text-orange-700",
      converted: "bg-emerald-100 text-emerald-700",
      lost: "bg-red-100 text-red-700",
      stalled: "bg-gray-100 text-gray-700",
    };
    return colors[stage] ?? "bg-gray-100 text-gray-700";
  };

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase_order: "PO",
      quotation: "Quotation",
      sketch: "Sketch",
      photo: "Photo",
      contract: "Contract",
      invoice: "Invoice",
      payment_proof: "Payment Proof",
      other: "Other",
    };
    return labels[type] ?? type;
  };

  const getDocTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      purchase_order: "bg-blue-100 text-blue-700",
      quotation: "bg-purple-100 text-purple-700",
      sketch: "bg-amber-100 text-amber-700",
      photo: "bg-emerald-100 text-emerald-700",
      contract: "bg-rose-100 text-rose-700",
      invoice: "bg-cyan-100 text-cyan-700",
      payment_proof: "bg-green-100 text-green-700",
      other: "bg-gray-100 text-gray-700",
    };
    return colors[type] ?? "bg-gray-100 text-gray-700";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AdminLayout>
      <AdminAuthGuard>
        <div className="flex items-center gap-4">
          <button
            className="rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
            onClick={() => router.navigate({ to: "/admin/leads" })}
          >
            ← Back to Leads
          </button>
          <PageHeader
            title={localLead.lead_reference}
            description={`${localLead.contact_name}${localLead.company_name ? ` — ${localLead.company_name}` : ""}`}
          />
        </div>

        {localLead && (
          <div className="mt-4 space-y-6">
            {/* Score + Stage */}
            <div className="flex flex-wrap gap-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Score</p>
                <p className="mt-1 text-2xl font-bold">{localLead.score}</p>
                <p className="text-xs text-muted-foreground">priority points</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stage</p>
                <div className="mt-1">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${getStageColor(localLead.stage)}`}
                  >
                    {LEAD_STAGE[localLead.stage as keyof typeof LEAD_STAGE] ?? localLead.stage}
                  </span>
                </div>
                {localLead.stage !== "converted" && localLead.stage !== "lost" && (
                  <select
                    className="mt-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                    value={localLead.stage}
                    onChange={(e) => handleStageChange(e.target.value)}
                  >
                    {stageOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</p>
                <p className="mt-1 text-lg font-semibold">{localLead.source}</p>
                {localLead.source_url && (
                  <a href={localLead.source_url} target="_blank" className="text-sm text-blue-600 hover:underline">
                    {localLead.source_url}
                  </a>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-base font-semibold">Contact Information</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Contact Name</p>
                  <p className="mt-0.5 font-medium">{localLead.contact_name}</p>
                </div>
                {localLead.contact_role && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Role</p>
                    <p className="mt-0.5">{localLead.contact_role}</p>
                  </div>
                )}
                {localLead.phone && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Phone</p>
                    <p className="mt-0.5">{localLead.phone}</p>
                  </div>
                )}
                {localLead.email && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Email</p>
                    <a href={`mailto:${localLead.email}`} className="text-blue-600 hover:underline">
                      {localLead.email}
                    </a>
                  </div>
                )}
                {localLead.company_name && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Company</p>
                    <p className="mt-0.5 font-medium">{localLead.company_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Customer Type</p>
                  <p className="mt-0.5">{localLead.customer_type_label}</p>
                </div>
              </div>
            </div>

            {/* Project Information */}
            {(localLead.project_name || localLead.project_location || localLead.project_description) && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-base font-semibold">Project Information</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {localLead.project_name && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Project Name</p>
                      <p className="mt-0.5 font-medium">{localLead.project_name}</p>
                    </div>
                  )}
                  {localLead.project_location && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Location</p>
                      <p className="mt-0.5">{localLead.project_location}</p>
                    </div>
                  )}
                  {localLead.project_type && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Project Type</p>
                      <p className="mt-0.5">{localLead.project_type}</p>
                    </div>
                  )}
                  {localLead.budget_range && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Budget Range</p>
                      <p className="mt-0.5 font-semibold text-amber-700">{localLead.budget_range}</p>
                    </div>
                  )}
                  {localLead.estimated_start_date && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Est. Start</p>
                      <p className="mt-0.5">{localLead.estimated_start_date}</p>
                    </div>
                  )}
                  {localLead.estimated_completion_date && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Est. Completion</p>
                      <p className="mt-0.5">{localLead.estimated_completion_date}</p>
                    </div>
                  )}
                </div>
                {localLead.project_description && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground">Description</p>
                    <p className="mt-0.5 whitespace-pre-wrap">{localLead.project_description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Signals */}
            {localLead.signals && localLead.signals.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-base font-semibold">Lead Signals</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {localLead.signals.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
                    >
                      {s.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Documents */}
            {docs && docs.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Attached Documents</h3>
                  <span className="text-xs text-muted-foreground">{docs.length} file(s)</span>
                </div>
                <div className="mt-3 space-y-2">
                  {docs.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2"
                    >
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getDocTypeColor(doc.document_type)}`}>
                        {getDocTypeLabel(doc.document_type)}
                      </span>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0 truncate text-sm text-blue-600 hover:underline"
                      >
                        {doc.file_name}
                      </a>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size_bytes)}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("en-PH")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-base font-semibold">Activity Timeline</h3>

              {/* Add activity */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a note..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={activityText}
                  onChange={(e) => setActivityText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
                />
                <select
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                >
                  <option value="note">Note</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="follow-up-scheduled">Follow-up</option>
                  <option value="proposal-sent">Proposal Sent</option>
                </select>
                <button
                  className="rounded-lg bg-ring text-ring-foreground px-3 py-2 text-sm hover:bg-ring/90 disabled:opacity-50"
                  onClick={handleAddActivity}
                  disabled={!activityText.trim() || submitting}
                >
                  {submitting ? "..." : "Add"}
                </button>
              </div>

              {/* Timeline */}
              <div className="mt-4 space-y-3">
                {localActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activities yet.</p>
                ) : (
                  localActivities.map((act) => (
                    <div key={act.id} className="flex gap-3">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ring text-xs font-semibold text-ring-foreground">
                        {act.type?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{act.description}</p>
                        <div className="mt-0.5 flex gap-2 text-xs text-muted-foreground">
                          <span>{act.type}</span>
                          <span>·</span>
                          <span>{act.by}</span>
                          <span>·</span>
                          <span>{new Date(act.occurred_at).toLocaleString("en-PH")}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notes */}
            {localLead.notes && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-base font-semibold">Notes</h3>
                <p className="mt-1 whitespace-pre-wrap">{localLead.notes}</p>
              </div>
            )}

            {/* Convert Lead */}
            {localLead.stage !== "converted" && localLead.stage !== "lost" && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-base font-semibold">Convert Lead</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Convert this lead to a customer and optionally create a project.
                </p>
                <button
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  onClick={() => setShowConvertModal(true)}
                >
                  <Plus size={16} />
                  Convert Lead
                </button>
              </div>
            )}

            {/* Convert Modal */}
            {showConvertModal && (
              <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-lg">
                <h3 className="text-base font-semibold">Convert Lead to Customer</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the customer details. Find existing customers in the Customers section.
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Customer ID (UUID)</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={convertData.customer_id}
                      onChange={(e) => setConvertData((d) => ({ ...d, customer_id: e.target.value }))}
                      placeholder="Enter customer UUID"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Customer Name</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={convertData.customer_name}
                      onChange={(e) => setConvertData((d) => ({ ...d, customer_name: e.target.value }))}
                      placeholder="Customer display name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Project ID (optional)</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={convertData.project_id}
                      onChange={(e) => setConvertData((d) => ({ ...d, project_id: e.target.value }))}
                      placeholder="Enter project UUID if creating project"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Project Name (optional)</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={convertData.project_name}
                      onChange={(e) => setConvertData((d) => ({ ...d, project_name: e.target.value }))}
                      placeholder="Project name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
                    <textarea
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      rows={3}
                      value={convertData.notes}
                      onChange={(e) => setConvertData((d) => ({ ...d, notes: e.target.value }))}
                      placeholder="Conversion notes"
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    className="rounded-lg border border-border bg-background px-4 py-2 text-sm"
                    onClick={() => setShowConvertModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    onClick={handleConvert}
                    disabled={!convertData.customer_id || !convertData.customer_name || submitting}
                  >
                    {submitting ? "Converting..." : "Convert"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </AdminAuthGuard>
    </AdminLayout>
  );
}
