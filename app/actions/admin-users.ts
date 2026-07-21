"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, getActiveCohort } from "@/lib/auth";
import { generatePassword } from "@/lib/utils";

export interface CreateUserState {
  error?: string;
  credentials?: { full_name: string; username: string; email: string; password: string };
}

/**
 * Creates the auth user, its profile row, cohort membership, and assignments
 * for every task already in the cohort — so someone joining mid-cohort still
 * sees the full backlog.
 */
export async function createParticipant(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireAdmin();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();

  if (!fullName || !email || !username) {
    return { error: "Name, email, and username are all required." };
  }
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return {
      error: "Usernames are 3–32 characters: letters, numbers, dot, dash, underscore.",
    };
  }

  const admin = createAdminClient();
  const password = generatePassword();

  const { data: existing } = await admin
    .from("users")
    .select("id")
    .or(`email.eq.${email},username.eq.${username}`)
    .maybeSingle();

  if (existing) {
    return { error: "That email or username is already taken." };
  }

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !created.user) {
    return { error: authError?.message ?? "Could not create the auth user." };
  }

  const { error: profileError } = await admin.from("users").insert({
    id: created.user.id,
    email,
    full_name: fullName,
    username,
    role: "participant",
  });

  if (profileError) {
    // Roll the auth user back so a retry with the same email isn't blocked.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: profileError.message };
  }

  const cohort = await getActiveCohort();

  if (cohort) {
    await admin
      .from("cohort_members")
      .insert({ cohort_id: cohort.id, user_id: created.user.id });

    const { data: tasks } = await admin
      .from("tasks")
      .select("id")
      .eq("cohort_id", cohort.id);

    if (tasks?.length) {
      await admin.from("task_assignments").insert(
        tasks.map((t) => ({
          task_id: t.id,
          user_id: created.user!.id,
          status: "pending" as const,
        })),
      );
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");

  return { credentials: { full_name: fullName, username, email, password } };
}

/** Removes the auth user; the profile row cascades from it. */
export async function deleteParticipant(userId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return {};
}

/** Issues a fresh password for a participant who lost theirs. */
export async function resetParticipantPassword(userId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const password = generatePassword();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };

  return { password };
}

export async function exportProgressCsv() {
  await requireAdmin();
  const supabase = await createClient();
  const cohort = await getActiveCohort();
  if (!cohort) return { error: "No active cohort." };

  const { getCohortProgress } = await import("@/lib/queries");
  const rows = await getCohortProgress(cohort.id);

  const { data: submissionRows } = await supabase
    .from("submissions")
    .select("user_id");

  const submissionCounts = new Map<string, number>();
  for (const s of (submissionRows ?? []) as { user_id: string }[]) {
    submissionCounts.set(s.user_id, (submissionCounts.get(s.user_id) ?? 0) + 1);
  }

  const { toCsv } = await import("@/lib/utils");
  const csv = toCsv(
    [
      "Name",
      "Email",
      "Tasks completed",
      "Tasks total",
      "Progress %",
      "Overdue",
      "Submissions",
    ],
    rows.map((r) => [
      r.user.full_name,
      r.user.email,
      r.completed,
      r.total,
      r.percent,
      r.overdue,
      submissionCounts.get(r.user.id) ?? 0,
    ]),
  );

  return { csv, filename: `${cohort.name.replace(/\s+/g, "-")}-progress.csv` };
}
