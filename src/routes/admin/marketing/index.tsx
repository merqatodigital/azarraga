import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { DataTableShell } from "@/components/admin/DataTableShell";

export const Route = createFileRoute("/admin/marketing/")({
  component: MarketingPage,
});

function MarketingPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Marketing"
        subtitle="Prospects, campaigns, and lead sources"
      />

      <EmptyState
        title="No marketing data yet"
        description="Lead sources, prospect tracking, and campaign results will appear here once configured."
        icon="megaphone"
      />

      <div className="mt-6">
        <DataTableShell
          headers={["Prospect", "Source", "Status", "Last Contact", "Notes"]}
        />
      </div>
    </AdminLayout>
  );
}
