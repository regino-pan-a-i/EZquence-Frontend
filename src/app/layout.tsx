import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SupabaseProvider } from './supabase-provider';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EZquence',
  description: 'Manage your small company with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Toaster position="top-center" />
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
