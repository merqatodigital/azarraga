import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Users, Building } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { listCustomers, createCustomer } from "@/lib/operations.server";
import type { CustomerRow } from "@/lib/operations";

export const Route = createFileRoute("/admin/customers/")({
  component: CustomersPage,
});

function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    lead_source: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCustomers = useCallback(async () => {
    try {
      const c = await listCustomers();
      setCustomers(c);
    } catch {
      // Silently fail — page still renders
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const c = await createCustomer({ name: form.name, ...form });
      setCustomers((prev) => [c, ...prev]);
      setForm({ name: "", contact_name: "", phone: "", email: "", address: "", city: "", lead_source: "" });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <PageHeader title="Customers" description="Past and current customers with project history" />
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <Users className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Customers"
        description="Past and current customers with project history"
        action={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} className="mr-1" />
            {showForm ? "Cancel" : "New Customer"}
          </Button>
        }
      />

      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold">New Customer</h3>
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tagusao Construction and Trading Inc."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Name</Label>
                <Input
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="09XX XXX XXXX"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Purok San Pedro, Brgy. San Manuel"
                />
              </div>
              <div className="space-y-1.5">
                <Label>City / Municipality</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Puerto Princesa"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Lead Source</Label>
                <Input
                  value={form.lead_source}
                  onChange={(e) => setForm({ ...form, lead_source: e.target.value })}
                  placeholder="Facebook, Referral, Walk-in"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={saving || !form.name.trim()}>
                <Plus size={14} className="mr-1" />
                {saving ? "Creating…" : "Create Customer"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setShowForm(false);
                setForm({ name: "", contact_name: "", phone: "", email: "", address: "", city: "", lead_source: "" });
                setError("");
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <span className="text-sm text-muted-foreground">{filtered.length} customer(s)</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <EmptyState
              title="No customers yet"
              description="Create your first customer to start tracking projects and invoices."
              icon="users"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <Building size={14} />
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.contact_name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {c.city ?? c.address ? `${c.city ?? ""}${c.address ? `, ${c.address.split(",")[0] ?? ""}` : ""}`.trim() : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.lead_source ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString("en-PH")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
