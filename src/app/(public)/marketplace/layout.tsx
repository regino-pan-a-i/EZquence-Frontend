import { redirect } from 'next/navigation';
import { TanstackProvider } from '@/components/providers/tanstack-provider';


export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {

  return <TanstackProvider>{children}</TanstackProvider>;
}