import Sidebar from '@/components/sidebar/Sidebar';

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar variant="production" />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}