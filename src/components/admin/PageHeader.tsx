import { useLocation, useRouter } from "@tanstack/react-router";

const sectionIcons: Record<string, string> = {
  dashboard: "layout-dashboard",
  leads: "users",
  customers: "user-circle",
  projects: "hammer",
  quotes: "file-text",
  invoices: "receipt",
  payments: "banknote",
  documents: "folder",
  tasks: "check-square",
  tala: "bot",
  marketing: "megaphone",
  website: "globe",
  settings: "settings",
};

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const location = useLocation();
  const path = location.pathname.replace("/admin/", "").replace(/\/$/, "") || "dashboard";
  const iconName = sectionIcons[path] ?? "layout-dashboard";

  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export { PageHeader };
