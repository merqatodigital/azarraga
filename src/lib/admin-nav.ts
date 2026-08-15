export type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
};

// V1 is intentionally narrow: find business, quote business, bill business.
export const mainNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "layout-dashboard" },
  { label: "Leads", href: "/admin/leads", icon: "users" },
  { label: "Quotes", href: "/admin/quotes", icon: "file-text" },
  { label: "Invoices", href: "/admin/invoices", icon: "receipt" },
];

export const managementNavItems: AdminNavItem[] = [
  { label: "Website", href: "/admin/website", icon: "globe" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];
