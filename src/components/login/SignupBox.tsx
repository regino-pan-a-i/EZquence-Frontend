import { signup } from '@/lib/auth-actions';

export default function SignupBox() {
  const handleSubmit = async (formData: FormData) => {
    'use server';

    let firstPassword = formData.get('password') as string;
    let secondPassword = formData.get('confirmPassword') as string;

    if (firstPassword !== secondPassword) {
      throw new Error('Passwords do not match');
    }

    // Validate: at least 8 chars, contains a number and a special character
    const passwordPattern = /(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/;
    if (!passwordPattern.test(firstPassword)) {
      throw new Error(
        'Password must be at least 8 characters long and include at least one number and one special character.'
      );
    }
    await signup(formData);
  };

  return (
    <div className="m-5">
      <h2 className="mb-4 text-2xl font-bold">Enter Credentials</h2>
      <form className="p-8 mx-auto space-y-6 max-w-lg bg-white rounded-lg shadow-lg dark:bg-neutral-900">
        <label className="mb-1 text-sm font-medium" htmlFor="firstName">
          First Name:
        </label>
        <input
          className="py-2 px-3 w-full rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-neutral-700"
          id="firstName"
          name="firstName"
          type="text"
          required
        />

        <label className="mb-1 text-sm font-medium" htmlFor="lastName">
          Last Name:
        </label>
        <input
          className="py-2 px-3 w-full rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-neutral-700"
          id="lastName"
          name="lastName"
          type="text"
          required
        />

        <label className="mb-1 text-sm font-medium" htmlFor="company">
          Company:
        </label>
        <input
          className="py-2 px-3 w-full rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-neutral-700"
          id="company"
          name="company"
          type="text"
          required
        />

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
          minLength={8}
          pattern={'(?=.*\\d)(?=.*[^A-Za-z0-9]).*'}
          title="Password must be at least 8 characters long and include at least one number and one special character."
        />
        <label className="mb-1 text-sm font-medium" htmlFor="confirmPassword">
          Confirm Password:
        </label>
        <input
          className="py-2 px-3 w-full rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-neutral-700"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
        />

        <button
          type="submit"
          className="cursor-pointer py-2 w-full font-semibold text-white bg-gray-600 rounded transition hover:bg-gray-700"
          formAction={handleSubmit}
        >
          Sign up
        </button>
      </form>
    </div>
  );
}
