import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import {
  createLead,
  getLead,
  listLeads,
  updateLead,
  deleteLead,
  scoreLead,
  addLeadActivity,
  listLeadActivities,
  changeLeadStage,
  convertLeadToCustomerProject,
} from "@/lib/leads.server";
import { LeadRow, LeadActivity, LEAD_STAGE } from "@/lib/lead-knowledge";
import { CustomerRow, ProjectRow } from "@/lib/operations";
import { useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { UserPlus, Users, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";

// ──────────────────────────────────────────────────────────────────────────────
// Lead list page
// ──────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/leads/")({
  component: LeadsPage,
  loader: async () => {
    return { leads: [] as LeadRow[] };
  },
});

function LeadsPage() {
  const search = useSearch({ from: "/admin/leads/" });
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    source: "",
    customer_type: "",
    location: "",
    stage: "",
    sort_by_score: false,
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | boolean> = {};
      if (filters.search) params.search = filters.search;
      if (filters.source) params.source = filters.source;
      if (filters.customer_type) params.customer_type = filters.customer_type;
      if (filters.location) params.location = filters.location;
      if (filters.stage) params.stage = filters.stage;
      if (filters.sort_by_score) params.sort_by_score = true;

      const data = await listLeads({ data: params });
      setLeads(data);
    } catch (e) {
      console.error("Failed to load leads:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  const getStageLabel = (stage: string) => {
    const s = LEAD_STAGE;
    const labels: Record<string, string> = {
      [s.NEW]: "New",
      [s.CONTACTED]: "Contacted",
      [s.QUALIFIED]: "Qualified",
      [s.PROPOSING]: "Proposing",
      [s.NEGOTIATING]: "Negotiating",
      [s.CONVERTED]: "Converted",
      [s.LOST]: "Lost",
      [s.STALLED]: "Stalled",
    };
    return labels[stage] ?? stage;
  };

  const getSignalBadge = (signals: string[] | null) => {
    if (!signals || signals.length === 0) return null;
    const highPriority = signals.some(
      (s) => s === "resort_development" || s === "hotel_development" || s === "contractor_awarded"
    );
    return highPriority ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
        <AlertTriangle size={12} />
        Priority
      </span>
    ) : null;
  };

  return (
    <AdminLayout>
      <AdminAuthGuard>
        <PageHeader
          title="Leads"
          description="Manage sales leads and conversion pipeline"
        />

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search leads..."
            className="min-w-[200px] rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={filters.stage}
            onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value }))}
          >
            <option value="">All Stages</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposing">Proposing</option>
            <option value="negotiating">Negotiating</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
            <option value="stalled">Stalled</option>
          </select>
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={filters.source}
            onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}
          >
            <option value="">All Sources</option>
            <option value="website">Website</option>
            <option value="facebook">Facebook</option>
            <option value="google">Google</option>
            <option value="referral">Referral</option>
            <option value="walk-in">Walk-in</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={filters.customer_type}
            onChange={(e) => setFilters((f) => ({ ...f, customer_type: e.target.value }))}
          >
            <option value="">All Types</option>
            {Object.entries({
              general_contractor: "General Contractor",
              developer: "Developer",
              resort: "Resort",
              hotel: "Hotel",
              architect: "Architect",
              engineer: "Engineer",
              commercial_construction: "Commercial Construction",
              residential_construction: "Residential Construction",
            }).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <button
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
            onClick={() => setFilters((f) => ({ ...f, sort_by_score: !f.sort_by_score }))}
          >
            {filters.sort_by_score ? "Sorted by Score" : "Sort by Date"}
          </button>
          {(filters.search || filters.stage || filters.source || filters.customer_type || filters.location) && (
            <button
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
              onClick={() => setFilters({
                search: "", source: "", customer_type: "", location: "", stage: "", sort_by_score: false,
              })}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Lead list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            title="No Leads"
            description="Create a lead to start tracking potential customers"
            icon="inbox"
          />
        ) : (
          <div className="space-y-2">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{lead.lead_reference}</span>
                      {getSignalBadge(lead.signals)}
                      <StatusBadge status={lead.stage} />
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {lead.contact_name}
                      {lead.company_name ? ` — ${lead.company_name}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {lead.project_location && (
                        <span>📍 {lead.project_location}</span>
                      )}
                      {lead.project_name && (
                        <span>🏗 {lead.project_name}</span>
                      )}
                      {lead.project_type && (
                        <span>— {lead.project_type}</span>
                      )}
                      {lead.budget_range && (
                        <span className="font-medium text-foreground">💰 {lead.budget_range}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{lead.score}</span>
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString("en-PH")}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`/admin/leads/${lead.id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    View Details
                  </a>
                  {lead.stage !== "converted" && lead.stage !== "lost" && (
                    <button
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-100"
                      onClick={() => handleStageChange(lead.id, "qualified")}
                    >
                      Mark Qualified
                    </button>
                  )}
                  {lead.stage === "new" && (
                    <button
                      className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
                      onClick={() => handleStageChange(lead.id, "contacted")}
                    >
                      Mark Contacted
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminAuthGuard>
    </AdminLayout>
  );

  function handleStageChange(leadId: string, stage: string) {
    changeLeadStage({ data: { id: leadId, stage } })
      .then(() => fetchLeads())
      .catch((e) => console.error("Stage change failed:", e));
  }
}
