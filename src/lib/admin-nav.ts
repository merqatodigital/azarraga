export type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
};

export const mainNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "layout-dashboard" },
  { label: "Leads", href: "/admin/leads", icon: "users" },
  { label: "Customers", href: "/admin/customers", icon: "user-circle" },
  { label: "Projects", href: "/admin/projects", icon: "hammer" },
  { label: "Quotes", href: "/admin/quotes", icon: "file-text" },
  { label: "Invoices", href: "/admin/invoices", icon: "receipt" },
  { label: "Payments", href: "/admin/payments", icon: "banknote" },
  { label: "Documents", href: "/admin/documents", icon: "folder" },
  { label: "Tasks", href: "/admin/tasks", icon: "check-square" },
  { label: "TALA Activity", href: "/admin/tala", icon: "bot" },
  { label: "Marketing", href: "/admin/marketing", icon: "megaphone" },
];

export const managementNavItems: AdminNavItem[] = [
  { label: "Website", href: "/admin/website", icon: "globe" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];
