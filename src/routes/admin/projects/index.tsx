import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTableShell } from "@/components/admin/DataTableShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Hammer, Clock, MapPin, Building } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  listProjects,
  createProject,
  updateProject,
} from "@/lib/operations.server";
import { listCustomers } from "@/lib/operations.server";
import { PROJECT_STAGE, formatCents, computeBalance } from "@/lib/operations";
import type { ProjectRow, CustomerRow } from "@/lib/operations";

const stageLabels: Record<string, string> = {
  [PROJECT_STAGE.PROSPECT]: "Prospect",
  [PROJECT_STAGE.PO_RECEIVED]: "PO Received",
  [PROJECT_STAGE.PROCUREMENT_SHIPPING]: "Procurement & Shipping",
  [PROJECT_STAGE.FABRICATION]: "Fabrication",
  [PROJECT_STAGE.DELIVERY_INSTALLATION]: "Delivery & Installation",
  [PROJECT_STAGE.BILLING_COLLECTION]: "Billing & Collection",
  [PROJECT_STAGE.COMPLETED]: "Completed",
};

const stageVariants: Record<string, "neutral" | "info" | "warning" | "success" | "danger"> = {
  [PROJECT_STAGE.PROSPECT]: "neutral",
  [PROJECT_STAGE.PO_RECEIVED]: "info",
  [PROJECT_STAGE.PROCUREMENT_SHIPPING]: "warning",
  [PROJECT_STAGE.FABRICATION]: "warning",
  [PROJECT_STAGE.DELIVERY_INSTALLATION]: "success",
  [PROJECT_STAGE.BILLING_COLLECTION]: "info",
  [PROJECT_STAGE.COMPLETED]: "success",
};

export const Route = createFileRoute("/admin/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const [projects, setProjects] = useState<(ProjectRow & { customer?: CustomerRow })[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    customer_id: "",
    description: "",
    location: "",
    stage: PROJECT_STAGE.PROSPECT,
    po_value_cents: 0,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [projs, custs] = await Promise.all([listProjects(), listCustomers()]);
      setProjects(projs);
      setCustomers(custs);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.customer_id) return;
    setSaving(true);
    setError("");
    try {
      const poValueCents = Math.round(form.po_value_cents * 100);
      const p = await createProject({
        name: form.name,
        customer_id: form.customer_id,
        description: form.description,
        location: form.location,
        stage: form.stage,
        po_value_cents: poValueCents,
        notes: form.notes,
      });
      setProjects((prev) => [p as ProjectRow, ...prev]);
      setForm({
        name: "",
        customer_id: "",
        description: "",
        location: "",
        stage: PROJECT_STAGE.PROSPECT,
        po_value_cents: 0,
        notes: "",
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  const handleStageUpdate = async (projectId: string, stage: string) => {
    try {
      const updated = await updateProject({ id: projectId, stage });
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? (updated as ProjectRow) : p))
      );
    } catch {
      // silent
    }
  };

  const filtered = projects.filter((p) => {
    if (stageFilter !== "all" && p.stage !== stageFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.customer?.name?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q)
    );
  });

  const formatMoney = (cents: number) => {
    if (cents === 0) return "₱0.00";
    return formatCents(cents);
  };

  if (loading) {
    return (
      <AdminLayout>
        <PageHeader title="Projects" description="Fabrication and installation projects" />
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <Hammer className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const stageCounts = projects.reduce(
    (acc, p) => {
      acc[p.stage] = (acc[p.stage] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Projects"
        description="Fabrication and installation projects"
        action={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} className="mr-1" />
            {showForm ? "Cancel" : "New Project"}
          </Button>
        }
      />

      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold">New Project</h3>
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Project Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tara Hostel — El Nido"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Customer *</Label>
                <Select
                  value={form.customer_id}
                  onValueChange={(v) => setForm({ ...form, customer_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer…" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="El Nido, Palawan"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Stage</Label>
                <Select
                  value={form.stage}
                  onValueChange={(v) => setForm({ ...form, stage: v as typeof form.stage })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(stageLabels).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Total PO Value (₱)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.po_value_cents}
                  onChange={(e) => setForm({ ...form, po_value_cents: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Glass and aluminum systems for hostel"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={saving || !form.name.trim() || !form.customer_id}>
                <Plus size={14} className="mr-1" />
                {saving ? "Creating…" : "Create Project"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setShowForm(false);
                setForm({ name: "", customer_id: "", description: "", location: "", stage: PROJECT_STAGE.PROSPECT, po_value_cents: 0, notes: "" });
                setError("");
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline summary */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold">Pipeline Summary</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(stageLabels).map(([stage, label]) => {
            const count = stageCounts[stage] ?? 0;
            if (count === 0) return null;
            return (
              <span
                key={stage}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  stage === PROJECT_STAGE.COMPLETED
                    ? "bg-green-50 text-green-700"
                    : stage === PROJECT_STAGE.PROSPECT
                    ? "bg-gray-100 text-gray-700"
                    : stage === PROJECT_STAGE.BILLING_COLLECTION
                    ? "bg-blue-50 text-blue-700"
                    : stage === PROJECT_STAGE.DELIVERY_INSTALLATION
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {label}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {Object.entries(stageLabels).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{filtered.length} project(s)</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <EmptyState
              title="No projects yet"
              description="Create your first project to start tracking fabrication and installation work."
              icon="hammer"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">PO Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <Hammer size={14} />
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {p.customer?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {p.location ? (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-muted-foreground" />
                        {p.location}
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {[
                        p.stage,
                        p.client_po?.length > 0 ? "po-received" : null,
                      ]
                        .filter(Boolean)
                        .map((s) => (
                          <StatusBadge key={s} status={s as string} variant={stageVariants[s as string] ?? "neutral"} />
                        ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{formatMoney(p.po_value_cents)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString("en-PH")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
