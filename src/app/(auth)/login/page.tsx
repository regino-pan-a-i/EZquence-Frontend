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
  searchParams: {
    mode?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  // Check if mode=signup query parameter is present
  const isSignupMode = searchParams.mode === 'signup';

  return (
    <>
      {isSignupMode ? <SignupBox /> : <LoginBox />}
    </>
  );
}
