import { TanstackProvider } from '@/components/providers/tanstack-provider';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth-utils';
import { UserRole } from '@/utils/supabase/schema';
import Link from 'next/link';
import { FiHome, FiShoppingCart, FiPackage, FiUser } from 'react-icons/fi';
import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const userRole = await getUserRole();

  // Redirect if not authenticated or not a customer
  if (!userRole) {
    redirect('/login');
  }

  if (userRole !== UserRole.CLIENT) {
    const redirectPath = userRole === UserRole.ADMIN ? '/admin/dashboard' : '/production/dashboard';
    redirect(`${redirectPath}?error=unauthorized`);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-neutral-950">
      <TanstackProvider>
        {/* Main content area with padding for bottom nav */}
        <main className="flex-1 overflow-auto pb-20">
          {children}
        </main>

        {/* Mobile-first bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 shadow-lg z-50 safe-area-inset-bottom">
          <div className="flex justify-around items-center h-16 px-2">
            <NavItem href="/customer/products" icon={<FiHome size={24} />} label="Products" />
            <NavItem href="/customer/cart" icon={<FiShoppingCart size={24} />} label="Cart" />
            <NavItem href="/customer/orders" icon={<FiPackage size={24} />} label="Orders" />
            <NavItem href="/account" icon={<FiUser size={24} />} label="Account" />
          </div>
        </nav>
      </TanstackProvider>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href}
      className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors active:scale-95"
    >
      <span className="mb-1">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
