export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/\s+/g, "-");
  const styles: Record<string, string> = {
    new: "bg-blue-50 text-blue-700 border-blue-200",
    contacted: "bg-gray-100 text-gray-700 border-gray-200",
    qualified: "bg-green-50 text-green-700 border-green-200",
    site_visit: "bg-amber-50 text-amber-700 border-amber-200",
    quoted: "bg-indigo-50 text-indigo-700 border-indigo-200",
    won: "bg-green-50 text-green-700 border-green-200",
    lost: "bg-red-50 text-red-700 border-red-200",
    active: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-gray-100 text-gray-700 border-gray-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    issued: "bg-blue-50 text-blue-700 border-blue-200",
    paid: "bg-green-50 text-green-700 border-green-200",
    partial: "bg-amber-50 text-amber-700 border-amber-200",
    unpaid: "bg-red-50 text-red-700 border-red-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    open: "bg-blue-50 text-blue-700 border-blue-200",
    resolved: "bg-green-50 text-green-700 border-green-200",
    connected: "bg-green-50 text-green-700 border-green-200",
    disconnected: "bg-red-50 text-red-700 border-red-200",
    standby: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const label = normalized
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
        styles[normalized] ?? "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {label}
    </span>
  );
}
