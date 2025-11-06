'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import SidebarButton from './buttons/SidebarButton';
import {
  FaTachometerAlt,
  FaChartLine,
  FaBoxOpen,
  FaBoxes,
  FaIndustry,
  FaUsers,
  FaShoppingCart,
  FaUserCircle,
  FaCog,
  FaSyncAlt,
} from 'react-icons/fa';

type SidebarVariant = 'admin' | 'production';

export default function Sidebar({ variant = 'admin' }: { variant?: SidebarVariant }) {
  const [open, setOpen] = useState(true);

  // Default admin items (previous behavior)
  const adminItems = [
    { label: 'Dashboard', key: 'dashboard', href: '/admin/dashboard' },
    { label: 'Analysis', key: 'analysis', href: '/admin/analysis' },
    { label: 'Product', key: 'product', href: '/admin/product' },
    { label: 'Inventory', key: 'inventory', href: '/admin/inventory' },
    { label: 'Production', key: 'production', href: '/admin/production' },
    { label: 'Users', key: 'users', href: '/admin/users' },
    { label: 'Order', key: 'order', href: '/admin/order' },
    { label: 'Account', key: 'account', href: '/account' },
    { label: 'Settings', key: 'settings', href: '/settings' },
  ];

  // Production worker items requested by user
  const productionItems = [
    { label: 'Dashboard', key: 'dashboard', href: '/production' },
    { label: 'Orders', key: 'order', href: '/production/orders' },
    { label: 'Inventory', key: 'inventory', href: '/production/inventory' },
    { label: 'Process', key: 'process', href: '/production/process' },
  ];

  // Pick items based on requested variant
  const items = variant === 'production' ? productionItems : adminItems;

  // small FontAwesome icon generator per label (keeps the same iconFor constant format)
  const iconFor = (key: string) => {
    switch (key) {
      case 'dashboard':
        return <FaTachometerAlt className="h-5 w-5" />;
      case 'analysis':
        return <FaChartLine className="h-5 w-5" />;
      case 'product':
        return <FaBoxOpen className="h-5 w-5" />;
      case 'inventory':
        return <FaBoxes className="h-5 w-5" />;
      case 'production':
        return <FaIndustry className="h-5 w-5" />;
      case 'users':
        return <FaUsers className="h-5 w-5" />;
      case 'order':
        return <FaShoppingCart className="h-5 w-5" />;
      case 'account':
        return <FaUserCircle className="h-5 w-5" />;
      case 'settings':
        return <FaCog className="h-5 w-5" />;
      case 'process':
        return <FaSyncAlt className="h-5 w-5" />;
      default:
        return <FaTachometerAlt className="h-5 w-5" />;
    }
  };
  const pathname = usePathname() ?? '/';

  return (
    <aside
      className={`${open ? 'w-[15%] lg:w-[9%]' : 'w-[7%] lg:w-[4%]'} h-screen bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 transition-all duration-200 flex flex-col justify-between`}
    >
      <div className="flex flex-col">
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="flex items-center gap-3 w-full">
            <div className="shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center">
              {/* simple logo mark */}
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-gray-700 dark:text-gray-200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7l10 5 10-5-10-5z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {!open && <div className="grow" />}
            {open && <span className="font-semibold text-lg truncate">EZquence</span>}
          </div>
        </div>

        {/* Navigation buttons */}
        <nav className="px-2 py-4 space-y-1">
          {items.map((it) => (
            <div key={it.key} className="px-1">
              <SidebarButton
                label={it.label}
                icon={iconFor(it.key)}
                collapsed={!open}
                href={it.href}
                active={pathname === it.href}
              />
            </div>
          ))}
        </nav>
      </div>

      {/* Footer: toggle button */}
      <div className="px-3 py-4">
        <button
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-5 w-5 transform transition-transform ${open ? 'rotate-180' : 'rotate-0'}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </aside>
  );
}
