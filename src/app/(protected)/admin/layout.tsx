import Sidebar from '@/components/sidebar/Sidebar';
import { TanstackProvider } from '@/components/providers/tanstack-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar variant="admin" />
      <main className="flex-1 overflow-auto m-4">
        <TanstackProvider>{children}</TanstackProvider>
      </main>
    </div>
  );
}
