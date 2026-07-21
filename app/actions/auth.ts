"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";

export interface ActionState {
  error?: string;
  success?: string;
}

/**
 * Participants log in with a username, but Supabase Auth is email/password.
 * The service-role client resolves username -> email first; that lookup is the
 * only thing it does here, and the password is still verified by Supabase.
 */
export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const identifier = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!identifier || !password) {
    return { error: "Enter your username and password." };
  }

  let email = identifier;

  if (!identifier.includes("@")) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("users")
      .select("email")
      .ilike("username", identifier)
      .maybeSingle();

    // Fall through with the raw input on a miss so the error message below
    // stays identical whether the username or the password was wrong.
    if (data?.email) email = data.email;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "That username and password don't match." };

  redirect(next && next.startsWith("/") ? next : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Nothing is collected here any more — the step exists so a participant lands
 * on a welcome screen once, and stamps onboarded_at on the way through.
 * Both params are required by the useActionState signature.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function completeOnboarding(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const user = await requireUser();

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Your name can't be blank." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: "Profile saved." };
}

export async function changePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (password.length < 10) {
    return { error: "Use at least 10 characters." };
  }
  if (password !== confirm) {
    return { error: "Those passwords don't match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };
  return { success: "Password updated." };
}
