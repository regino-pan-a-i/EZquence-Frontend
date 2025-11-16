import Sidebar from '@/components/sidebar/Sidebar';
import { TanstackProvider } from '@/components/providers/tanstack-provider';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth-utils';
import { UserRole } from '@/utils/supabase/schema';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userRole = await getUserRole();

  // Redirect if not authenticated or not an admin
  if (!userRole) {
    redirect('/login');
  }

  if (userRole !== UserRole.ADMIN) {
    redirect('/production/dashboard?error=unauthorized');
  }

  return (
    <div className="flex h-screen">
      <Sidebar variant="admin" />
      <main className="flex-1 overflow-auto m-4">
        <TanstackProvider>{children}</TanstackProvider>
      </main>
    </div>
  );
}
