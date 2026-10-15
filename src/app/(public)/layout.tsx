import React from 'react';
import Link from 'next/link';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Navigation Bar */}
      <nav className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-foreground">
              EZquence
            </Link>
            <div className="flex gap-4">
              <Link
                href="/marketplace"
                className="text-foreground text-muted hover:text-link"
              >
                Marketplace
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
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
