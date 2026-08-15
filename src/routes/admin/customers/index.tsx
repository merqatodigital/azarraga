import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { DataTableShell } from "@/components/admin/DataTableShell";

export const Route = createFileRoute("/admin/customers/")({
  component: CustomersPage,
});

function CustomersPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Customers"
        subtitle="Past and current customers with project history"
      />

      <EmptyState
        title="No customers yet"
        description="Customers will be created from approved leads and projects."
        icon="users"
      />

      <div className="mt-6">
        <DataTableShell
          headers={["Customer", "Contact", "Location", "Projects", "Last Activity"]}
        />
      </div>
    </AdminLayout>
  );
}
