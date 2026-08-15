export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="pl-[260px]">
        <AdminHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
