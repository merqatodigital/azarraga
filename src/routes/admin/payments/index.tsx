import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { DataTableShell } from "@/components/admin/DataTableShell";

export const Route = createFileRoute("/admin/payments/")({
  component: PaymentsPage,
});

function PaymentsPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Payments"
        subtitle="Payments received, partial payments, and outstanding balances"
      />

      <EmptyState
        title="No payment records yet"
        description="Payments will be recorded against invoices. The balance for each invoice is calculated from confirmed payments only."
        icon="banknote"
      />

      <div className="mt-6">
        <DataTableShell
          headers={["Payment ID", "Invoice", "Customer", "Amount", "Date", "Method", "Status"]}
        />
      </div>
    </AdminLayout>
  );
}
