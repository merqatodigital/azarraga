import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { DataTableShell } from "@/components/admin/DataTableShell";

export const Route = createFileRoute("/admin/invoices/")({
  component: InvoicesPage,
});

function InvoicesPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Invoices"
        subtitle="Issued invoices and outstanding balances"
      />

      <EmptyState
        title="No invoices yet"
        description="Invoices will be created from approved projects. Balances are calculated from confirmed payments only."
        icon="receipt"
      />

      <div className="mt-6">
        <DataTableShell
          headers={["Invoice #", "Customer", "Project", "Total", "Paid", "Balance", "Status"]}
        />
      </div>
    </AdminLayout>
  );
}
