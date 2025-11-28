import Sidebar from '@/components/sidebar/Sidebar';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth-utils';

export default async function ProductionLayout({ children }: { children: React.ReactNode }) {
  const userRole = await getUserRole();

  // Redirect if not authenticated
  if (!userRole) {
    redirect('/login');
  }

  // Both ADMIN and WORKER can access production routes
  // No additional role check needed

  return (
    <div className="flex h-screen">
      <Sidebar variant="production" />
      <main className="flex-1 overflow-auto m-4">{children}</main>
    </div>
  );
}
