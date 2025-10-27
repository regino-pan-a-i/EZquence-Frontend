import Sidebar from '@/components/sidebar/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar variant="admin" />
      <main className="flex-1 overflow-auto m-4">
        {children}
      </main>
    </div>
  );
}