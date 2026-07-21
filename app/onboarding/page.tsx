import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "./OnboardingForm";

export const metadata = { title: "Welcome — AI Savvy Founders" };

export default async function OnboardingPage() {
  const user = await requireUser();

  // Admins skip onboarding; participants who already did it don't repeat it.
  if (user.role === "admin") redirect("/admin");
  if (user.onboarded_at) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-14">
      <p className="text-xs uppercase tracking-[0.14em] text-terracotta">
        You&apos;re in
      </p>
      <h1 className="mt-3 text-3xl leading-tight">
        Welcome, {user.full_name.split(" ")[0]}
      </h1>
      <p className="mt-2.5 text-sm text-smoke">
        Your tasks are already waiting. You&apos;ll see what&apos;s due each day
        on your dashboard, submit work where it&apos;s asked for, and can ask
        questions on any task — those threads stay between you and your admin.
      </p>

      <div className="mt-9">
        <OnboardingForm />
      </div>
    </div>
  );
}
