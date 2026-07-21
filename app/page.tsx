import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

/** Entry point: route each role to the right home. */
export default async function Home() {
  const user = await requireUser();

  if (user.role === "admin") redirect("/admin");
  if (!user.onboarded_at) redirect("/onboarding");
  redirect("/dashboard");
}
