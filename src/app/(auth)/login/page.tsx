import LoginBox from '@/components/login/LoginBox';
import SignupBox from '@/components/login/SignupBox';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | EZquence',
  description: 'Login to your account on EZquence. Manage services, teams, and more.',
  keywords: '',
  robots: 'noindex, nofollow',
};

interface LoginPageProps {
  searchParams: Promise<{
    mode?: string;
  }>;
}


export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Await searchParams in Next.js 15
  const params = await searchParams;
  const isSignupMode = params.mode === 'signup';

  return (
    <>
      {isSignupMode ? <SignupBox /> : <LoginBox />}
    </>
  );
}