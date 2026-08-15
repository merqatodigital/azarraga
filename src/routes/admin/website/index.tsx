import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { saveSiteContent, getSiteContent } from "@/lib/site-content.functions";

export const Route = createFileRoute("/admin/website/")({
  component: WebsitePage,
});

function WebsitePage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Website"
        subtitle="Manage the public website content and CMS"
      />

      <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Website CMS</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md">
          The legacy website CMS is preserved in the public site component. To edit website content, use the admin panel on the live site.
        </p>
        <Button asChild className="mt-4">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open Public Site
          </a>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <EmptyState
          title="CMS Location"
          description="The website content management is currently built into the public site component. Access it by opening the public site and entering the admin passkey."
          icon="file"
        />
        <EmptyState
          title="Future State"
          description="Eventually the website CMS will be fully integrated into this admin panel with Supabase Auth protection."
          icon="users"
        />
      </div>
    </AdminLayout>
  );
}
