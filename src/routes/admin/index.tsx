import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { MetricCard } from "@/components/admin/MetricCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { Receipt, Hammer, Banknote, Clock, ArrowUpRight } from "lucide-react";
import { getDashboardStats } from "@/lib/operations.server";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
  loader: async () => {
    let stats;
    try {
      stats = await getDashboardStats();
    } catch {
      stats = null;
    }
    return { stats };
  },
});

function DashboardPage() {
  const { stats } = Route.useRouteContext();

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description="Azarraga Glass & Aluminum — operational overview"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Receivables"
          value={stats ? formatCents(stats.totalReceivables) : "—"}
          icon={Receipt}
          description={stats ? "Outstanding invoice balances" : "No invoice data yet"}
        />
        <MetricCard
          title="Active Projects"
          value={stats ? stats.activeProjectsCount.toString() : "—"}
          icon={Hammer}
          description="In production (not completed)"
        />
        <MetricCard
          title="Collections Due"
          value={stats ? (stats.collectionsDue > 0 ? "Today" : "—") : "—"}
          icon={Banknote}
          description={stats ? `Invoices due ${new Date().toLocaleDateString("en-PH")}` : "No invoice data yet"}
        />
        <MetricCard
          title="Overdue Collections"
          value={stats ? stats.overdueCount.toString() : "—"}
          icon={Clock}
          description={stats && stats.overdueCount > 0 ? "Requires immediate attention" : "No overdue invoices"}
        />
        <MetricCard
          title="Billing-Ready Projects"
          value={stats ? stats.billingProjectsCount.toString() : "—"}
          icon={ArrowUpRight}
          description="Ready for invoicing"
        />
        <MetricCard
          title="Billing Outstanding"
          value={stats ? formatCents(stats.billingOutstanding) : "—"}
          icon={Banknote}
          description="Open invoice balances on billing-ready projects"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <EmptyState
          title={stats && stats.overdueCount > 0 ? "Overdue Collections" : "No Overdue Bills"}
          description={
            stats && stats.overdueCount > 0
              ? `${stats.overdueCount} invoice(s) past their due date need collection.`
              : "No overdue invoices. Keep it that way."
          }
          icon="alert-circle"
        />
        <EmptyState
          title={stats && stats.collectionsDue > 0 ? "Due Today" : "No Collections Today"}
          description={
            stats && stats.collectionsDue > 0
              ? `${stats.collectionsDue} invoice(s) are due for collection today.`
              : "Nothing due for collection today."
          }
          icon="alert-circle"
        />
        <EmptyState
          title={stats && stats.billingProjectsCount > 0 ? "Projects Ready to Bill" : "No Projects Ready to Bill"}
          description={
            stats && stats.billingProjectsCount > 0
              ? `${stats.billingProjectsCount} project(s) are in delivery or billing stage and ready for invoicing.`
              : "No projects currently in delivery/installation or billing/collection stage."
          }
          icon="file"
        />
        <EmptyState
          title="Quick Actions"
          description="Navigate to Customers, Projects, Invoices, or Payments to get started."
          icon="settings"
        />
      </div>

      {stats && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold">Financial Summary</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Outstanding</p>
              <p className="mt-1 text-xl font-bold">{formatCents(stats.totalReceivables)}</p>
              <p className="text-xs text-muted-foreground">Across all open invoices</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Billing Ready</p>
              <p className="mt-1 text-xl font-bold">{formatCents(stats.billingOutstanding)}</p>
              <p className="text-xs text-muted-foreground">On {stats.billingProjectsCount} project(s)</p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function formatCents(cents: number): string {
  if (cents === 0) return "₱0.00";
  const abs = Math.abs(cents);
  const pesos = Math.floor(abs / 100);
  const centavos = abs % 100;
  return `₱${pesos.toLocaleString("en-PH")}.${centavos.toString().padStart(2, "0")}`;
}
