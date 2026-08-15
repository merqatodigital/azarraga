import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { DataTableShell } from "@/components/admin/DataTableShell";

export const Route = createFileRoute("/admin/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Projects"
        subtitle="Fabrication and installation projects"
      />

      <EmptyState
        title="No projects yet"
        description="Approved quotations become projects. Projects will appear here once operational data is connected."
        icon="users"
      />

      <div className="mt-6">
        <DataTableShell
          headers={["Project", "Customer", "Status", "Quote", "Installation", "Balance"]}
        />
      </div>
    </AdminLayout>
  );
}
