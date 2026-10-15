import { login } from '@/lib/auth-actions';
import Link from 'next/link';

interface LoginBoxProps {
  returnTo?: string;
}

export default function LoginBox({ returnTo }: LoginBoxProps) {
  return (
    <div className="m-5">
      <h2 className="mb-4 text-2xl font-bold">Enter Credentials</h2>
      <form className="p-8 mx-auto space-y-6 max-w-lg bg-surface rounded-lg shadow-lg">
        {returnTo && (
          <input type="hidden" name="returnTo" value={returnTo} />
        )}
        <label className="mb-1 text-sm font-medium" htmlFor="email">
          Email:
        </label>
        <input
          className="py-2 px-3 w-full rounded border border-border focus:ring-2 focus:ring-accent focus:outline-none"
          id="email"
          name="email"
          type="email"
          required
        />
        <label className="mb-1 text-sm font-medium" htmlFor="password">
          Password:
        </label>
        <input
          className="py-2 px-3 w-full rounded border border-border focus:ring-2 focus:ring-accent focus:outline-none"
          id="password"
          name="password"
          type="password"
          required
        />

        <button
          type="submit"
          className="cursor-pointer py-2 w-full font-semibold text-primary-foreground bg-primary rounded transition hover:bg-primary-hover"
          formAction={login}
        >
          Log in
        </button>

        <div className="text-center mt-4">
          <p className="text-sm text-muted">
            Don&apos;t have an account?{' '}
            <Link
              href="/login?mode=signup"
              className="font-medium text-link hover:text-link transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
