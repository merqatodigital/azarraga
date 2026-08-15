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
import { Plus, Search, Receipt, FileText, Calendar, Building } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { formatCents, computeBalance, INVOICE_STATUS } from "@/lib/operations";
import type { InvoiceRow, CustomerRow, ProjectRow, ClientPORow, InvoiceLineItemRow, PaymentRow } from "@/lib/operations";
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  cancelInvoice,
  addInvoiceLineItem,
  deleteInvoiceLineItem,
} from "@/lib/operations.server";
import {
  listCustomers,
  getCustomer,
  listProjects,
  getProject,
  listClientPOs,
} from "@/lib/operations.server";

const statusLabels: Record<string, string> = {
  [INVOICE_STATUS.DRAFT]: "Draft",
  [INVOICE_STATUS.ISSUED]: "Issued",
  [INVOICE_STATUS.PARTIALLY_PAID]: "Partially Paid",
  [INVOICE_STATUS.PAID]: "Paid",
  [INVOICE_STATUS.OVERDUE]: "Overdue",
  [INVOICE_STATUS.CANCELLED]: "Cancelled",
};

const statusVariants: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  [INVOICE_STATUS.DRAFT]: "neutral",
  [INVOICE_STATUS.ISSUED]: "info",
  [INVOICE_STATUS.PARTIALLY_PAID]: "warning",
  [INVOICE_STATUS.PAID]: "success",
  [INVOICE_STATUS.OVERDUE]: "danger",
  [INVOICE_STATUS.CANCELLED]: "neutral",
};

export const Route = createFileRoute("/admin/invoices/")({
  component: InvoicesPage,
});

function InvoicesPage() {
  const [invoices, setInvoices] = useState<(InvoiceRow & {
    customer?: CustomerRow;
    project?: (ProjectRow & { customer?: CustomerRow }) | null;
    client_po?: ClientPORow | null;
    line_items?: (InvoiceLineItemRow & { payments?: PaymentRow[] })[];
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<InvoiceRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    customer_id: "",
    project_id: "",
    client_po_id: "",
    due_date: new Date().toISOString().split("T")[0],
    billing_milestone: "",
    notes: "",
    payment_terms: "",
    line_items: [] as {
      description: string;
      product_type: string;
      glass_type: string;
      glass_thickness_mm: number;
      aluminum_system: string;
      quantity: number;
      unit: string;
      unit_price_cents: number;
      discount_cents: number;
      tax_cents: number;
      line_total_cents: number;
      remarks: string;
    }[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const invs = await listInvoices();
      setInvoices(invs);
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
    if (!form.customer_id || !form.project_id || form.line_items.length === 0) {
      setError("Customer, project, and at least one line item are required.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const lineItems = form.line_items.map((item, idx) => ({
        description: item.description,
        product_type: item.product_type,
        glass_type: item.glass_type,
        glass_thickness_mm: item.glass_thickness_mm,
        aluminum_system: item.aluminum_system,
        quantity: item.quantity,
        unit: item.unit,
        unit_price_cents: Math.round(item.unit_price_cents),
        discount_cents: Math.round(item.discount_cents),
        tax_cents: Math.round(item.tax_cents),
        line_total_cents: Math.round(item.line_total_cents),
        remarks: item.remarks,
      }));

      const subtotal = lineItems.reduce((s, li) => s + li.line_total_cents, 0);
      const discount = lineItems.reduce((s, li) => s + li.discount_cents, 0);
      const tax = lineItems.reduce((s, li) => s + li.tax_cents, 0);
      const total = subtotal - discount + tax;

      const invoice = await createInvoice({
        customer_id: form.customer_id,
        project_id: form.project_id,
        client_po_id: form.client_po_id || undefined,
        due_date: form.due_date,
        billing_milestone: form.billing_milestone || undefined,
        notes: form.notes || undefined,
        payment_terms: form.payment_terms || undefined,
        line_items: lineItems,
        subtotal_cents: subtotal,
        discount_cents: discount,
        tax_cents: tax,
        total_cents: total,
        status: "draft",
      });

      setInvoices((prev) => [invoice as InvoiceRow, ...prev]);
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      customer_id: "",
      project_id: "",
      client_po_id: "",
      due_date: new Date().toISOString().split("T")[0],
      billing_milestone: "",
      notes: "",
      payment_terms: "",
      line_items: [],
    });
    setError("");
  };

  const handleStatusUpdate = async (invoiceId: string, status: string) => {
    try {
      const updated = await updateInvoice({ id: invoiceId, status });
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? (updated as InvoiceRow) : inv))
      );
    } catch {
      // silent
    }
  };

  const handleCancel = async (invoiceId: string) => {
    if (!confirm("Cancel this invoice? This cannot be undone.")) return;
    try {
      await cancelInvoice({ id: invoiceId });
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "cancelled" } : inv))
      );
    } catch {
      // silent
    }
  };

  const openDetail = async (invoiceId: string) => {
    setDetailLoading(true);
    try {
      const inv = await getInvoice({ id: invoiceId });
      setDetailInvoice(inv as InvoiceRow);
    } catch {
      setError("Failed to load invoice details");
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer?.name?.toLowerCase().includes(q) ||
      inv.project?.name?.toLowerCase().includes(q) ||
      inv.client_po?.po_number?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <AdminLayout>
        <PageHeader title="Invoices" description="Issued invoices and outstanding balances" />
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <Receipt className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Invoices"
        description="Issued invoices and outstanding balances"
        action={
          <Button size="sm" onClick={() => { setShowForm(!showForm); resetForm(); }}>
            <Plus size={14} className="mr-1" />
            {showForm ? "Cancel" : "New Invoice"}
          </Button>
        }
      />

      {/* Invoice creation form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold">New Invoice</h3>
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Customer *</Label>
                <Select
                  value={form.customer_id}
                  onValueChange={(v) => {
                    setForm({ ...form, customer_id: v, project_id: "", client_po_id: "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select customer…</SelectItem>
                    {[
                      // Customers will be loaded from API — placeholder
                    ].map((_, i) => (
                      <SelectItem key={i} value={`cust-${i}`}>Loading…</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Project *</Label>
                <Select
                  value={form.project_id}
                  onValueChange={(v) => setForm({ ...form, project_id: v })}
                  disabled={!form.customer_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select project…</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Client PO Reference</Label>
                <Input
                  value={form.client_po_id}
                  onChange={(e) => setForm({ ...form, client_po_id: e.target.value })}
                  placeholder="PO-2024-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Billing Milestone</Label>
                <Select
                  value={form.billing_milestone}
                  onValueChange={(v) => setForm({ ...form, billing_milestone: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    <SelectItem value="1st Payment (40%)">1st Payment (40%)</SelectItem>
                    <SelectItem value="2nd Payment (30%)">2nd Payment (30%)</SelectItem>
                    <SelectItem value="3rd Payment (30%)">3rd Payment (30%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment Terms</Label>
                <Select
                  value={form.payment_terms}
                  onValueChange={(v) => setForm({ ...form, payment_terms: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Payment instructions, deposit requirements, etc."
                />
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="mb-0">Line Items</Label>
                <Button variant="outline" size="sm" onClick={() => {
                  setForm({
                    ...form,
                    line_items: [
                      ...form.line_items,
                      {
                        description: "",
                        product_type: "",
                        glass_type: "",
                        glass_thickness_mm: 0,
                        aluminum_system: "",
                        quantity: 1,
                        unit: "pcs",
                        unit_price_cents: 0,
                        discount_cents: 0,
                        tax_cents: 0,
                        line_total_cents: 0,
                        remarks: "",
                      },
                    ],
                  });
                }}>
                  <Plus size={14} className="mr-1" />
                  Add Line Item
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {form.line_items.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-border bg-background p-3">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => {
                            const items = [...form.line_items];
                            items[idx] = { ...items[idx], description: e.target.value };
                            setForm({ ...form, line_items: items });
                          }}
                          placeholder="10mm tempered clear glass swing door"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Product Type</Label>
                        <Input
                          value={item.product_type}
                          onChange={(e) => {
                            const items = [...form.line_items];
                            items[idx] = { ...items[idx], product_type: e.target.value };
                            setForm({ ...form, line_items: items });
                          }}
                          placeholder="Frameless Glass"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Glass Type</Label>
                        <Input
                          value={item.glass_type}
                          onChange={(e) => {
                            const items = [...form.line_items];
                            items[idx] = { ...items[idx], glass_type: e.target.value };
                            setForm({ ...form, line_items: items });
                          }}
                          placeholder="Tempered Clear"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Thickness (mm)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.glass_thickness_mm}
                          onChange={(e) => {
                            const items = [...form.line_items];
                            items[idx] = { ...items[idx], glass_thickness_mm: parseInt(e.target.value) || 0 };
                            setForm({ ...form, line_items: items });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Aluminum System</Label>
                        <Input
                          value={item.aluminum_system}
                          onChange={(e) => {
                            const items = [...form.line_items];
                            items[idx] = { ...items[idx], aluminum_system: e.target.value };
                            setForm({ ...form, line_items: items });
                          }}
                          placeholder="900 Series"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const items = [...form.line_items];
                            items[idx] = { ...items[idx], quantity: parseInt(e.target.value) || 1 };
                            setForm({ ...form, line_items: items });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Unit</Label>
                        <Input
                          value={item.unit}
                          onChange={(e) => {
                            const items = [...form.line_items];
                            items[idx] = { ...items[idx], unit: e.target.value };
                            setForm({ ...form, line_items: items });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Unit Price (₱)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price_cents / 100 || 0}
                          onChange={(e) => {
                            const items = [...form.line_items];
                            items[idx] = { ...items[idx], unit_price_cents: Math.round(parseFloat(e.target.value) * 100) || 0 };
                            setForm({ ...form, line_items: items });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Discount (₱)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.discount_cents / 100 || 0}
                          onChange={(e) => {
                            const items = [...form.line_items];
                            items[idx] = { ...items[idx], discount_cents: Math.round(parseFloat(e.target.value) * 100) || 0 };
                            setForm({ ...form, line_items: items });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Tax (₱)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.tax_cents / 100 || 0}
                          onChange={(e) => {
                            const items = [...form.line_items];
                            items[idx] = { ...items[idx], tax_cents: Math.round(parseFloat(e.target.value) * 100) || 0 };
                            setForm({ ...form, line_items: items });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Line Total (₱)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.line_total_cents / 100 || 0}
                          onChange={(e) => {
                            const items = [...form.line_items];
                            items[idx] = { ...items[idx], line_total_cents: Math.round(parseFloat(e.target.value) * 100) || 0 };
                            setForm({ ...form, line_items: items });
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-auto py-1 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        const items = form.line_items.filter((_, i) => i !== idx);
                        setForm({ ...form, line_items: items });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            {form.line_items.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCents(form.line_items.reduce((s, li) => s + li.line_total_cents, 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">-{formatCents(form.line_items.reduce((s, li) => s + li.discount_cents, 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax/VAT</span>
                  <span className="font-medium">+{formatCents(form.line_items.reduce((s, li) => s + li.tax_cents, 0))}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCents(
                    form.line_items.reduce((s, li) => s + li.line_total_cents, 0)
                    - form.line_items.reduce((s, li) => s + li.discount_cents, 0)
                    + form.line_items.reduce((s, li) => s + li.tax_cents, 0)
                  )}</span>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={saving || !form.customer_id || !form.project_id || form.line_items.length === 0}>
                <Plus size={14} className="mr-1" />
                {saving ? "Creating…" : "Create Invoice"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice list */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by invoice #, customer, project, PO…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(statusLabels).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{filtered.length} invoice(s)</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <EmptyState
              title="No invoices yet"
              description="Create your first invoice from a project. Balances are calculated from confirmed payments only."
              icon="receipt"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client PO</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issue Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paid</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((inv) => {
                const paid = inv.amount_paid_cents ?? 0;
                const balance = computeBalance(inv.total_cents ?? 0, paid);
                return (
                  <tr key={inv.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                          <FileText size={14} />
                        </div>
                        <span className="font-mono font-medium text-sm">{inv.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{inv.customer?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{inv.project?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{inv.client_po?.po_number ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString("en-PH") : "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {inv.due_date ? (
                          <>
                            <Calendar size={14} className="text-muted-foreground" />
                            {new Date(inv.due_date).toLocaleDateString("en-PH")}
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status ?? "draft"} variant={statusVariants[inv.status ?? "draft"]} />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCents(inv.total_cents ?? 0)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatCents(paid)}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${balance > 0 ? "text-amber-600" : "text-green-600"}`}>
                      {formatCents(balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoice detail drawer */}
      {detailInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailInvoice(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Invoice {detailInvoice.invoice_number}</h2>
              <Button variant="ghost" size="sm" onClick={() => setDetailInvoice(null)}>
                Close
              </Button>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Bill To</h3>
                <div className="mt-2">
                  <p className="font-medium">{detailInvoice.customer?.name ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">{detailInvoice.customer?.contact_name ?? ""}</p>
                  <p className="text-sm text-muted-foreground">{detailInvoice.customer?.phone ?? ""}</p>
                  <p className="text-sm text-muted-foreground">{detailInvoice.customer?.email ?? ""}</p>
                  <p className="text-sm text-muted-foreground">{detailInvoice.customer?.address ?? ""}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Project</h3>
                <div className="mt-2">
                  <p className="font-medium">{detailInvoice.project?.name ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">{detailInvoice.project?.customer?.name ?? ""}</p>
                  <p className="text-sm text-muted-foreground">{detailInvoice.client_po?.po_number ? `PO: ${detailInvoice.client_po.po_number}` : ""}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-medium">{detailInvoice.issue_date ? new Date(detailInvoice.issue_date).toLocaleDateString("en-PH") : "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{detailInvoice.due_date ? new Date(detailInvoice.due_date).toLocaleDateString("en-PH") : "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">
                  <StatusBadge status={detailInvoice.status ?? "draft"} variant={statusVariants[detailInvoice.status ?? "draft"]} />
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billing Milestone</p>
                <p className="font-medium">{detailInvoice.billing_milestone ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Terms</p>
                <p className="font-medium">{detailInvoice.payment_terms ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{detailInvoice.notes ?? "—"}</p>
              </div>
            </div>

            {/* Financial summary */}
            <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Financial Summary</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCents(detailInvoice.subtotal_cents ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">-{formatCents(detailInvoice.discount_cents ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax/VAT</span>
                  <span className="font-medium">+{formatCents(detailInvoice.tax_cents ?? 0)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCents(detailInvoice.total_cents ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium">{formatCents(detailInvoice.amount_paid_cents ?? 0)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-base font-bold">
                  <span>Balance Due</span>
                  <span className={detailInvoice.amount_paid_cents != null && detailInvoice.total_cents > 0 && detailInvoice.amount_paid_cents >= detailInvoice.total_cents ? "text-green-600" : "text-amber-600"}>
                    {formatCents(computeBalance(detailInvoice.total_cents ?? 0, detailInvoice.amount_paid_cents ?? 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Line Items</h3>
              {((detailInvoice as InvoiceRow & { line_items?: (InvoiceLineItemRow & { payments?: PaymentRow[] })[] }).line_items)?.length ? (
                <table className="mt-3 w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">#</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product/Spec</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit Price</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discount</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tax</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {((detailInvoice as InvoiceRow & { line_items?: (InvoiceLineItemRow & { payments?: PaymentRow[] })[] }).line_items ?? []).map((li) => (
                      <tr key={li.id} className="text-sm">
                        <td className="px-3 py-2 text-muted-foreground">{li.sort_order + 1}</td>
                        <td className="px-3 py-2 font-medium">{li.description}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {[
                            li.product_type,
                            li.glass_type ? `${li.glass_type}` : null,
                            li.glass_thickness_mm ? `${li.glass_thickness_mm}mm` : null,
                            li.aluminum_system,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{li.quantity}</td>
                        <td className="px-3 py-2 text-muted-foreground">{li.unit}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatCents(li.unit_price_cents ?? 0)}</td>
                        <td className="px-3 py-2 text-muted-foreground">-{formatCents(li.discount_cents ?? 0)}</td>
                        <td className="px-3 py-2 text-muted-foreground">+{formatCents(li.tax_cents ?? 0)}</td>
                        <td className="px-3 py-2 font-medium">{formatCents(li.line_total_cents ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No line items.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
