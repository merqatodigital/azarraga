import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { DataTableShell } from "@/components/admin/DataTableShell";

export const Route = createFileRoute("/admin/tasks/")({
  component: TasksPage,
});

function TasksPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Tasks"
        subtitle="Follow-ups, reminders, and operational tasks"
      />

      <EmptyState
        title="No tasks yet"
        description="Tasks can be created manually or suggested by TALA. Follow-up reminders will appear here."
        icon="check"
      />

      <div className="mt-6">
        <DataTableShell
          headers={["Task", "Related To", "Due", "Assignee", "Status"]}
        />
      </div>
    </AdminLayout>
  );
}
