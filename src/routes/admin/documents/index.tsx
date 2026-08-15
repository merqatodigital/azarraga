import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { DataTableShell } from "@/components/admin/DataTableShell";

export const Route = createFileRoute("/admin/documents/")({
  component: DocumentsPage,
});

function DocumentsPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Documents"
        subtitle="Quotations, purchase orders, invoices, receipts, and related files"
      />

      <EmptyState
        title="No documents yet"
        description="Upload quotations, purchase orders, invoices, or other project documents. TALA can help extract structured data from uploaded files."
        icon="folder"
      />

      <div className="mt-6">
        <DataTableShell
          headers={["Document", "Type", "Customer", "Project", "Date", "Attached To"]}
        />
      </div>
    </AdminLayout>
  );
}
