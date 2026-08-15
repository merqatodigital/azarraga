import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { DataTableShell } from "@/components/admin/DataTableShell";

export const Route = createFileRoute("/admin/quotes/")({
  component: QuotesPage,
});

function QuotesPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Quotes"
        subtitle="Quotations — drafts, issued, and awaiting follow-up"
      />

      <EmptyState
        title="No quotations yet"
        description="Quotation drafts prepared by TALA or entered manually will appear here."
        icon="file"
      />

      <div className="mt-6">
        <DataTableShell
          headers={["Quote #", "Customer", "Project", "Amount", "Status", "Issued", "Follow-up"]}
        />
      </div>
    </AdminLayout>
  );
}
