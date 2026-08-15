import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { DataTableShell } from "@/components/admin/DataTableShell";

export const Route = createFileRoute("/admin/leads/")({
  component: LeadsPage,
});

function LeadsPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Leads"
        subtitle="Inquiries, prospects, and qualified opportunities"
      />

      <EmptyState
        title="No leads yet"
        description="Website inquiries and manual entries will appear here once lead capture is connected to the operational database."
        icon="inbox"
      />

      <div className="mt-6">
        <DataTableShell
          headers={["Name", "Source", "Status", "Created", "Last Contact"]}
        />
      </div>
    </AdminLayout>
  );
}
