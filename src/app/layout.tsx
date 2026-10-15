import type { Metadata } from 'next';
import { Inter, Inter as InterMono } from 'next/font/google';
import { SupabaseProvider } from './supabase-provider';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const interSans = Inter({
  variable: '--font-inter-sans',
  subsets: ['latin'],
});

const interMono = InterMono({
  variable: '--font-inter-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'EZquence',
  description: 'Manage your small company with ease.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${interSans.variable} ${interMono.variable} antialiased`}>
        <Toaster position="top-center" />
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
