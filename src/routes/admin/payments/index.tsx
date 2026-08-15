import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Banknote, Calendar, Check, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { formatCents, computeBalance } from "@/lib/operations";
import type { PaymentRow, InvoiceRow, CustomerRow, ProjectRow, ClientPORow } from "@/lib/operations";
import {
  listInvoices,
  getInvoice,
  createPayment,
  confirmPayment,
  deletePayment,
} from "@/lib/operations.server";

const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "bank-transfer", label: "Bank Transfer" },
  { value: "gcash", label: "GCash" },
  { value: "paymaya", label: "PayMaya" },
  { value: "card", label: "Credit/Debit Card" },
  { value: "other", label: "Other" },
];

export const Route = createFileRoute("/admin/payments/")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const [invoices, setInvoices] = useState<(InvoiceRow & {
    customer?: CustomerRow;
    project?: (ProjectRow & { customer?: CustomerRow }) | null;
    client_po?: ClientPORow | null;
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [form, setForm] = useState({
    amount_cents: 0,
    payment_method: "cash",
    reference: "",
    notes: "",
    confirmed: false,
    payment_date: new Date().toISOString().split("T")[0],
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
    if (!selectedInvoice || form.amount_cents <= 0) {
      setError("Select an invoice and enter an amount.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payment = await createPayment({
        invoice_id: selectedInvoice,
        amount_cents: form.amount_cents,
        payment_method: form.payment_method,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
        confirmed: form.confirmed,
        payment_date: form.payment_date,
      });
      await load();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ amount_cents: 0, payment_method: "cash", reference: "", notes: "", confirmed: false, payment_date: new Date().toISOString().split("T")[0] });
    setSelectedInvoice(null);
    setError("");
  };

  const handleConfirmToggle = async (paymentId: string, currentlyConfirmed: boolean) => {
    try {
      await confirmPayment({ payment_id: paymentId, confirmed: !currentlyConfirmed });
      await load();
    } catch {
      // silent
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Delete this payment record? The invoice balance will be recalculated.")) return;
    try {
      await deletePayment({ id: paymentId });
      await load();
    } catch {
      // silent
    }
  };

  const relevantInvoices = invoices.filter(
    (inv) => inv.status !== "cancelled" && inv.status !== "paid" && inv.amount_paid_cents != null
  );

  const totalBalance = relevantInvoices.reduce((s, inv) => {
    const paid = inv.amount_paid_cents ?? 0;
    return s + computeBalance(inv.total_cents ?? 0, paid);
  }, 0);

  if (loading) {
    return (
      <AdminLayout>
        <PageHeader title="Payments" description="Payments received, partial payments, and outstanding balances" />
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <Banknote className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Payments"
        description="Record and manage payments against invoices"
        action={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} className="mr-1" />
            {showForm ? "Cancel" : "Record Payment"}
          </Button>
        }
      />

      {/* Outstanding balance summary */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold">Outstanding Balance</h3>
        <p className="mt-1 text-2xl font-bold text-amber-600">{formatCents(totalBalance)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Across {relevantInvoices.length} open invoice(s). Balance is calculated as total minus confirmed payments.
        </p>
      </div>

      {/* Payment form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold">Record Payment</h3>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Invoice *</Label>
              <Select
                value={selectedInvoice ?? ""}
                onValueChange={(v) => setSelectedInvoice(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select invoice…" />
                </SelectTrigger>
                <SelectContent>
                  {relevantInvoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_number} — {inv.customer?.name} (Balance: {formatCents(computeBalance(inv.total_cents ?? 0, inv.amount_paid_cents ?? 0))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Amount (₱) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount_cents / 100 || 0}
                  onChange={(e) => setForm({ ...form, amount_cents: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select
                  value={form.payment_method}
                  onValueChange={(v) => setForm({ ...form, payment_method: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reference / Check #</Label>
                <Input
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder="Check #1234 or GCloud ref"
                />
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

            <div className="flex items-center gap-3">
              <Label className="mb-0">Mark as confirmed</Label>
              <input
                type="checkbox"
                checked={form.confirmed}
                onChange={(e) => setForm({ ...form, confirmed: e.target.checked })}
                className="h-4 w-4 rounded border-input bg-background"
              />
              <span className="text-xs text-muted-foreground">
                {form.confirmed ? "Payment will be included in invoice balance calculations." : "Unconfirmed payments are recorded but not applied to the balance."}
              </span>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={saving || !selectedInvoice || form.amount_cents <= 0}>
                <Plus size={14} className="mr-1" />
                {saving ? "Recording…" : "Record Payment"}
              </Button>
              <Button variant="outline" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payments list by invoice */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by invoice #, customer, project…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <EmptyState
              title="No invoices yet"
              description="Create invoices first, then record payments against them."
              icon="banknote"
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {invoices.map((inv) => {
              const paid = inv.amount_paid_cents ?? 0;
              const balance = computeBalance(inv.total_cents ?? 0, paid);
              const hasPayments = inv.line_items?.some((li) => li.payments && li.payments.length > 0) ?? false;

              if (search && ![
                inv.invoice_number,
                inv.customer?.name,
                inv.project?.name,
              ].some((v) => v?.toLowerCase().includes(search.toLowerCase()))) {
                return null;
              }

              return (
                <div key={inv.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <Receipt size={18} />
                      </div>
                      <div>
                        <p className="font-medium">{inv.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{inv.customer?.name} — {inv.project?.name}</p>
                      </div>
                    </div>
                    <StatusBadge status={inv.status ?? "draft"} variant={
                      inv.status === "paid" ? "success" :
                      inv.status === "partially-paid" ? "warning" :
                      inv.status === "overdue" ? "danger" :
                      inv.status === "issued" ? "info" : "neutral"
                    } />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium ml-1">{formatCents(inv.total_cents ?? 0)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="font-medium ml-1 text-green-600">{formatCents(paid)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Balance:</span>
                      <span className={`font-medium ml-1 ${balance > 0 ? "text-amber-600" : "text-green-600"}`}>
                        {formatCents(balance)}
                      </span>
                    </div>
                    {inv.issue_date && (
                      <div>
                        <span className="text-muted-foreground">Issued:</span>
                        <span className="ml-1">{new Date(inv.issue_date).toLocaleDateString("en-PH")}</span>
                      </div>
                    )}
                    {inv.due_date && (
                      <div>
                        <span className="text-muted-foreground">Due:</span>
                        <span className="ml-1">{new Date(inv.due_date).toLocaleDateString("en-PH")}</span>
                      </div>
                    )}
                  </div>

                  {/* Payments for this invoice */}
                  {(inv.line_items)?.flatMap((li) => li.payments ?? []).length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payments Recorded</h4>
                      <div className="mt-2 space-y-2">
                        {((inv.line_items as { payments?: PaymentRow[] }[]) || []).flatMap((li) => li.payments ?? []).map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-700">
                                <Check size={14} />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{payment.payment_number}</p>
                                <p className="text-xs text-muted-foreground">
                                  {payment.payment_method} · {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("en-PH") : ""}
                                  {payment.reference ? ` · Ref: ${payment.reference}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{formatCents(payment.amount_cents)}</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={payment.confirmed}
                                  onChange={() => handleConfirmToggle(payment.id, payment.confirmed)}
                                  className="h-3.5 w-3.5 rounded border-input"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {payment.confirmed ? "Confirmed" : "Pending"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeletePayment(payment.id)}
                                className="rounded text-xs text-red-600 hover:bg-red-50 px-2 py-1"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add payment button */}
                  {balance > 0 && (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedInvoice(inv.id);
                          setShowForm(true);
                        }}
                      >
                        <Plus size={14} className="mr-1" />
                        Record Payment (Balance: {formatCents(balance)})
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
