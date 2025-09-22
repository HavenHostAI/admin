import { SignInForm } from "~/components/auth/SignInForm";

interface SignInPageProps {
  searchParams?: {
    message?: string;
  };
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  const successMessage = searchParams?.message;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <a
              href="/auth/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              create a new account
            </a>
          </p>
        </div>
        <SignInForm successMessage={successMessage} />
      </div>
    </div>
  );
}
