interface DataTableShellProps {
  headers: string[];
  children?: React.ReactNode;
}

export function DataTableShell({ headers, children }: DataTableShellProps) {
  if (children) {
    return <div className="space-y-3">{children}</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          <tr>
            <td colSpan={headers.length} className="px-6 py-12 text-center text-sm text-gray-400">
              Data table shell — connect to data source
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
