import { login } from '@/lib/auth-actions';
import Link from 'next/link';

interface LoginBoxProps {
  returnTo?: string;
}

export default function LoginBox({ returnTo }: LoginBoxProps) {
  return (
    <div className="m-5">
      <h2 className="mb-4 text-2xl font-bold">Enter Credentials</h2>
      <form className="p-8 mx-auto space-y-6 max-w-lg bg-white rounded-lg shadow-lg dark:bg-neutral-900">
        {returnTo && (
          <input type="hidden" name="returnTo" value={returnTo} />
        )}
        <label className="mb-1 text-sm font-medium" htmlFor="email">
          Email:
        </label>
        <input
          className="py-2 px-3 w-full rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-neutral-700"
          id="email"
          name="email"
          type="email"
          required
        />
        <label className="mb-1 text-sm font-medium" htmlFor="password">
          Password:
        </label>
        <input
          className="py-2 px-3 w-full rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-neutral-700"
          id="password"
          name="password"
          type="password"
          required
        />

        <button
          type="submit"
          className="cursor-pointer py-2 w-full font-semibold text-white bg-blue-600 rounded transition hover:bg-blue-700"
          formAction={login}
        >
          Log in
        </button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              href="/login?mode=signup"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
