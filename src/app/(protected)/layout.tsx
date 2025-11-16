import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth-utils';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await isAuthenticated();

  // Redirect to login if not authenticated
  if (!authenticated) {
    redirect('/login');
  }

  return <>{children}</>;
}
