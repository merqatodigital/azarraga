import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import {
  listQuotes,
  getQuote,
  addQuoteSystem,
  updateQuoteSystem,
  deleteQuoteSystem,
  validateQuote,
  submitQuoteForApproval,
  approveQuote,
  rejectQuote,
  cancelQuote,
  createQuote,
} from "@/lib/quotes.server";
import { listLeads } from "@/lib/leads.server";
import { listCustomers } from "@/lib/operations.server";
import { CustomerRow, ProjectRow } from "@/lib/operations";
import { PRODUCT_SYSTEMS, SPEC_FIELDS, QUOTE_STATUS, QuoteValidationResult } from "@/lib/quote-knowledge";
import { LeadRow } from "@/lib/lead-knowledge";
import { useState, useEffect, use } from "react";
import { Loader2, Plus, CheckCircle, XCircle, Save, Send, AlertTriangle, Edit2, Trash2, LayoutGrid } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/quotes/")({
  component: QuotesPage,
  loader: async () => ({ quotes: [] as any[] }),
});

function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [systems, setSystems] = useState<any[]>([]);
  const [validation, setValidation] = useState<QuoteValidationResult | null>(null);
  const [showSystemForm, setShowSystemForm] = useState(false);
  const [newSystem, setNewSystem] = useState<Record<string, any>>({
    system_key: "",
    quantity: 1,
    width_mm: "",
    height_mm: "",
    unit: "",
    configuration: "",
    glass_type: "",
    glass_thickness_mm: "",
    glass_color: "",
    aluminum_system: "",
    finish: "",
    hardware: "",
    screens: "",
    installation: "",
    location: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);

  useEffect(() => {
    loadQuotes();
    listCustomers({ data: {} }).then(setCustomers).catch(console.error);
  }, []);

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterSearch) params.search = filterSearch;
      const data = await listQuotes({ data: params });
      setQuotes(data);
    } catch (e) {
      console.error("Failed to load quotes:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuote = async (quote: any) => {
    setSelectedQuote(quote);
    try {
      const sys = await (await import("@/lib/quotes.server")).getQuote({ data: { id: quote.id } });
      setSystems((sys as any)?.quote_systems ?? []);
      const val = await (await import("@/lib/quotes.server")).validateQuote({ data: { quote_id: quote.id } });
      setValidation(val as QuoteValidationResult);
    } catch (e) {
      console.error("Failed to load quote details:", e);
    }
  };

  const handleAddSystem = async () => {
    if (!selectedQuote || !newSystem.system_key) return;
    setSubmitting(true);
    try {
      const sys = await addQuoteSystem({
        data: {
          quote_id: selectedQuote.id,
          system_key: newSystem.system_key,
          quantity: newSystem.quantity,
          width_mm: newSystem.width_mm ? parseInt(newSystem.width_mm) : undefined,
          height_mm: newSystem.height_mm ? parseInt(newSystem.height_mm) : undefined,
          unit: newSystem.unit || undefined,
          configuration: newSystem.configuration || undefined,
          glass_type: newSystem.glass_type || undefined,
          glass_thickness_mm: newSystem.glass_thickness_mm ? parseInt(newSystem.glass_thickness_mm) : undefined,
          glass_color: newSystem.glass_color || undefined,
          aluminum_system: newSystem.aluminum_system || undefined,
          finish: newSystem.finish || undefined,
          hardware: newSystem.hardware || undefined,
          screens: newSystem.screens || undefined,
          installation: newSystem.installation || undefined,
          location: newSystem.location || undefined,
          notes: newSystem.notes || undefined,
        },
      });
      setSystems((prev) => [...prev, sys]);
      setNewSystem({
        system_key: "", quantity: 1, width_mm: "", height_mm: "", unit: "",
        configuration: "", glass_type: "", glass_thickness_mm: "", glass_color: "",
        aluminum_system: "", finish: "", hardware: "", screens: "", installation: "", location: "", notes: "",
      });
      setShowSystemForm(false);
      const val = await validateQuote({ data: { quote_id: selectedQuote.id } });
      setValidation(val as QuoteValidationResult);
      loadQuotes();
    } catch (e) {
      console.error("Failed to add system:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSystem = async (sysId: string, updates: Record<string, any>) => {
    setSubmitting(true);
    try {
      const updated = await updateQuoteSystem({
        data: {
          id: sysId,
          ...updates,
          width_mm: updates.width_mm ? parseInt(updates.width_mm) : undefined,
          height_mm: updates.height_mm ? parseInt(updates.height_mm) : undefined,
          glass_thickness_mm: updates.glass_thickness_mm ? parseInt(updates.glass_thickness_mm) : undefined,
        },
      });
      setSystems((prev) => prev.map((s) => (s.id === sysId ? updated : s)));
      const val = await validateQuote({ data: { quote_id: selectedQuote.id } });
      setValidation(val as QuoteValidationResult);
    } catch (e) {
      console.error("Failed to update system:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSystem = async (sysId: string) => {
    if (!confirm("Delete this system from the quote?")) return;
    setSubmitting(true);
    try {
      await deleteQuoteSystem({ data: { id: sysId } });
      setSystems((prev) => prev.filter((s) => s.id !== sysId));
      const val = await validateQuote({ data: { quote_id: selectedQuote.id } });
      setValidation(val as QuoteValidationResult);
      loadQuotes();
    } catch (e) {
      console.error("Failed to delete system:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!selectedQuote) return;
    setSubmitting(true);
    try {
      await submitQuoteForApproval({ data: { id: selectedQuote.id, prepared_by: "owner" } });
      setSelectedQuote((prev) => ({ ...prev, status: "ready-for-approval" }));
      loadQuotes();
    } catch (e) {
      console.error("Failed to submit for approval:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedQuote) return;
    setSubmitting(true);
    try {
      await approveQuote({ data: { id: selectedQuote.id, approved_by: "owner" } });
      setSelectedQuote((prev) => ({ ...prev, status: "approved" }));
      loadQuotes();
    } catch (e) {
      console.error("Failed to approve:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedQuote) return;
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    setSubmitting(true);
    try {
      await rejectQuote({ data: { id: selectedQuote.id, reason } });
      setSelectedQuote((prev) => ({ ...prev, status: "draft" }));
      loadQuotes();
    } catch (e) {
      console.error("Failed to reject:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      "draft": "bg-gray-100 text-gray-700",
      "awaiting-specs": "bg-yellow-100 text-yellow-700",
      "ready-for-approval": "bg-blue-100 text-blue-700",
      "approved": "bg-emerald-100 text-emerald-700",
      "issued": "bg-purple-100 text-purple-700",
      "converted-to-p_o": "bg-cyan-100 text-cyan-700",
    };
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${colorMap[status] ?? "bg-gray-100 text-gray-700"}`}>
        {status.replace(/-/g, " ")}
      </span>
    );
  };

  const getSystemName = (key: string) => PRODUCT_SYSTEMS[key]?.name ?? key;

  return (
    <AdminLayout>
      <AdminAuthGuard>
        <div className="flex items-center justify-between">
          <PageHeader
            title="Quotes"
            description="Glass & aluminum quote management"
          />
          <button
            className="rounded-lg bg-ring text-ring-foreground px-4 py-2 text-sm font-medium hover:bg-ring/90"
            onClick={() => router.navigate({ to: "/admin/quotes/new" })}
          >
            <Plus size={16} className="mr-1" />
            New Quote
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ready-for-approval">Ready for Approval</option>
            <option value="approved">Approved</option>
            <option value="issued">Issued</option>
            <option value="converted-to-p_o">Converted</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="text"
            placeholder="Search quotes..."
            className="min-w-[200px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
        </div>

        {/* Quote list */}
        {loading ? (
          <div className="mt-6 flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : quotes.length === 0 ? (
          <EmptyState
            title="No Quotes"
            description="Create a quote to start tracking glass & aluminum proposals"
            icon="file"
          />
        ) : (
          <div className="mt-4 space-y-2">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className={`rounded-xl border ${selectedQuote?.id === quote.id ? "border-ring" : "border-border"} bg-card p-4 cursor-pointer transition-colors hover:bg-muted/50`}
                onClick={() => handleSelectQuote(quote)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{quote.quote_reference}</span>
                      {getStatusBadge(quote.status)}
                      {quote.customer && (
                        <span className="text-sm text-muted-foreground">
                          — {quote.customer.name}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {quote.quote_systems && quote.quote_systems.length > 0 && (
                        <span>{quote.quote_systems.length} system(s)</span>
                      )}
                      {quote.project && (
                        <span>Project: {quote.project.name}</span>
                      )}
                      <span>Created {new Date(quote.created_at).toLocaleDateString("en-PH")}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Prepared by</p>
                    <p className="font-medium">{quote.prepared_by}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quote Detail Panel */}
        {selectedQuote && (
          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedQuote.quote_reference}</h3>
              {getStatusBadge(selectedQuote.status)}
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Customer</p>
                <p className="mt-0.5 font-medium">
                  {selectedQuote.customer?.name ?? "Unknown"}
                </p>
              </div>
              {selectedQuote.project && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Project</p>
                  <p className="mt-0.5">{selectedQuote.project.name}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground">Prepared By</p>
                <p className="mt-0.5">{selectedQuote.prepared_by}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Created</p>
                <p className="mt-0.5">{new Date(selectedQuote.created_at).toLocaleString("en-PH")}</p>
              </div>
            </div>

            {selectedQuote.notes && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground">Notes</p>
                <p className="mt-0.5 text-sm">{selectedQuote.notes}</p>
              </div>
            )}

            {/* Systems */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Systems ({systems.length})</h4>
                <button
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                  onClick={() => setShowSystemForm(!showSystemForm)}
                >
                  {showSystemForm ? "Cancel" : "+ Add System"}
                </button>
              </div>

              {/* Add system form */}
              {showSystemForm && (
                <div className="mt-3 rounded-lg border border-border bg-background p-4">
                  <div className="mb-3">
                    <label className="text-xs font-medium text-muted-foreground">System</label>
                    <select
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={newSystem.system_key}
                      onChange={(e) => setNewSystem((n) => ({ ...n, system_key: e.target.value }))}
                    >
                      <option value="">Select system...</option>
                      {Object.entries(PRODUCT_SYSTEMS).map(([key, sys]) => (
                        <option key={key} value={key}>{sys.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.quantity}
                        onChange={(e) => setNewSystem((n) => ({ ...n, quantity: parseInt(e.target.value) || 1 }))}
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Unit</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.unit}
                        onChange={(e) => setNewSystem((n) => ({ ...n, unit: e.target.value }))}
                        placeholder="sqm / door / linear_meter"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Width (mm)</label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.width_mm}
                        onChange={(e) => setNewSystem((n) => ({ ...n, width_mm: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Height (mm)</label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.height_mm}
                        onChange={(e) => setNewSystem((n) => ({ ...n, height_mm: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Glass Type</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.glass_type}
                        onChange={(e) => setNewSystem((n) => ({ ...n, glass_type: e.target.value }))}
                        placeholder="Clear Tempered, Laminated, etc."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Glass Thickness (mm)</label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.glass_thickness_mm}
                        onChange={(e) => setNewSystem((n) => ({ ...n, glass_thickness_mm: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Aluminum System</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.aluminum_system}
                        onChange={(e) => setNewSystem((n) => ({ ...n, aluminum_system: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Location</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.location}
                        onChange={(e) => setNewSystem((n) => ({ ...n, location: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Configuration</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.configuration}
                        onChange={(e) => setNewSystem((n) => ({ ...n, configuration: e.target.value }))}
                        placeholder="2-panel sliding, 3-panel with 1 fixed..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Finish</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.finish}
                        onChange={(e) => setNewSystem((n) => ({ ...n, finish: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Hardware</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.hardware}
                        onChange={(e) => setNewSystem((n) => ({ ...n, hardware: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Screens</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.screens}
                        onChange={(e) => setNewSystem((n) => ({ ...n, screens: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Installation Notes</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.installation}
                        onChange={(e) => setNewSystem((n) => ({ ...n, installation: e.target.value }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">Notes</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        value={newSystem.notes}
                        onChange={(e) => setNewSystem((n) => ({ ...n, notes: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      className="rounded-lg bg-ring text-ring-foreground px-3 py-1.5 text-sm hover:bg-ring/90 disabled:opacity-50"
                      onClick={handleAddSystem}
                      disabled={!newSystem.system_key || submitting}
                    >
                      {submitting ? "Adding..." : "Add System"}
                    </button>
                    <button
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                      onClick={() => {
                        setShowSystemForm(false);
                        setNewSystem({
                          system_key: "", quantity: 1, width_mm: "", height_mm: "", unit: "",
                          configuration: "", glass_type: "", glass_thickness_mm: "", glass_color: "",
                          aluminum_system: "", finish: "", hardware: "", screens: "", installation: "", location: "", notes: "",
                        });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Systems list */}
              {systems.length > 0 && (
                <div className="mt-3 space-y-2">
                  {systems.map((sys) => (
                    <div key={sys.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <LayoutGrid size={14} className="text-muted-foreground" />
                          <span className="font-medium text-sm">{getSystemName(sys.system_key)}</span>
                          <span className="text-xs text-muted-foreground">
                            × {sys.quantity} {sys.unit ?? "units"}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            className="rounded text-xs text-blue-600 hover:bg-blue-50 p-1"
                            onClick={() => {
                              const updates: Record<string, any> = {};
                              const newWidth = prompt("Width (mm):", String(sys.width_mm ?? ""));
                              const newHeight = prompt("Height (mm):", String(sys.height_mm ?? ""));
                              const newQty = prompt("Quantity:", String(sys.quantity));
                              if (newWidth) updates.width_mm = newWidth;
                              if (newHeight) updates.height_mm = newHeight;
                              if (newQty) updates.quantity = parseInt(newQty) || 1;
                              if (Object.keys(updates).length > 0) handleUpdateSystem(sys.id, updates);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded text-xs text-red-600 hover:bg-red-50 p-1"
                            onClick={() => handleDeleteSystem(sys.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {sys.location && (
                        <p className="mt-1 text-xs text-muted-foreground">📍 {sys.location}</p>
                      )}
                      {sys.configuration && (
                        <p className="text-xs text-muted-foreground">{sys.configuration}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Validation results */}
              {validation && (
                <div className="mt-4 space-y-2">
                  {validation.critical_missing.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-sm font-semibold text-red-700 flex items-center gap-1">
                        <AlertTriangle size={16} />
                        Missing Required Specs ({validation.critical_missing.length})
                      </p>
                      <ul className="mt-1 space-y-1">
                        {validation.critical_missing.map((m, i) => (
                          <li key={i} className="text-xs text-red-600">
                            {m.label}: {m.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validation.warnings.length > 0 && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <p className="text-sm font-semibold text-yellow-700">Warnings</p>
                      <ul className="mt-1 space-y-1">
                        {validation.warnings.map((w, i) => (
                          <li key={i} className="text-xs text-yellow-600">{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validation.valid && validation.system_count > 0 && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle size={16} />
                        All specs complete — ready for owner review
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedQuote.status === "draft" && (
                  <button
                    className="rounded-lg bg-ring text-ring-foreground px-3 py-1.5 text-sm hover:bg-ring/90 disabled:opacity-50"
                    onClick={handleSubmitForApproval}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit for Approval"}
                  </button>
                )}
                {selectedQuote.status === "ready-for-approval" && (
                  <>
                    <button
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                      onClick={handleApprove}
                      disabled={submitting}
                    >
                      {submitting ? "Approving..." : "Approve Quote"}
                    </button>
                    <button
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                      onClick={handleReject}
                      disabled={submitting}
                    >
                      {submitting ? "..." : "Reject"}
                    </button>
                  </>
                )}
                {selectedQuote.status === "draft" && (
                  <button
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                    onClick={() => {
                      const reason = prompt("Cancellation reason (optional):");
                      if (reason !== null) {
                        cancelQuote({ data: { id: selectedQuote.id, reason: reason || undefined } })
                          .then(loadQuotes)
                          .catch(console.error);
                      }
                    }}
                  >
                    Cancel Quote
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </AdminAuthGuard>
    </AdminLayout>
  );
}
