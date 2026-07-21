import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in — AI Savvy Founders" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-[0.14em] text-terracotta">
          Cohort Tracker
        </p>
        <h1 className="mt-3 text-3xl leading-tight">
          AI Savvy <span className="italic-verb">Founders</span>
        </h1>
        <p className="mt-2.5 text-sm text-smoke">
          Sign in with the username and password your admin sent you.
        </p>

        <div className="mt-8">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
