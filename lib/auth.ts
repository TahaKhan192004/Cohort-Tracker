import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { AppUser, Cohort } from "./types";

/** The signed-in user's profile row, or null when signed out. */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as AppUser) ?? null;
}

/** Redirects to /login when signed out. Use at the top of protected pages. */
export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Like requireUser, but also forces the onboarding form on first login.
 * Participants only — the admin never sees onboarding.
 */
export async function requireOnboardedUser(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role === "participant" && !user.onboarded_at) redirect("/onboarding");
  return user;
}

/** Sends non-admins to their own dashboard rather than showing a 403. */
export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

export async function getActiveCohort(): Promise<Cohort | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cohorts")
    .select("*")
    .eq("is_active", true)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as Cohort) ?? null;
}

/** The cohort a participant belongs to, preferring the active one. */
export async function getMyCohort(userId: string): Promise<Cohort | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cohort_members")
    .select("cohort:cohorts(*)")
    .eq("user_id", userId);

  const cohorts = (data ?? [])
    .map((row) => (row as unknown as { cohort: Cohort }).cohort)
    .filter(Boolean);

  return cohorts.find((c) => c.is_active) ?? cohorts[0] ?? null;
}

/** Best-effort activity stamp for the admin's "last active" column. */
export async function touchLastActive(userId: string) {
  const supabase = await createClient();
  await supabase
    .from("users")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", userId);
}
