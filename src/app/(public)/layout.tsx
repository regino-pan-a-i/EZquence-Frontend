import React from 'react';
import Link from 'next/link';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Simple Navigation Bar */}
      <nav className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              EZquence
            </Link>
            <div className="flex gap-4">
              <Link
                href="/marketplace"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Marketplace
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
