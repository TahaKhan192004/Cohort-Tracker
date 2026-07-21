"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import type { SubmissionStatus } from "@/lib/types";

export async function reviewSubmission(
  submissionId: string,
  status: Exclude<SubmissionStatus, "submitted">,
  feedback: string,
) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, user_id, task_id")
    .eq("id", submissionId)
    .single();

  if (!submission) return { error: "Submission not found." };

  const { error } = await supabase
    .from("submissions")
    .update({
      status,
      admin_feedback: feedback.trim() || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) return { error: error.message };

  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", submission.task_id)
    .single();

  await notify({
    recipientId: submission.user_id,
    type: "feedback_given",
    title:
      status === "reviewed"
        ? "Your submission was reviewed"
        : "Your submission needs a revision",
    body: task?.title ?? null,
    link: `/tasks/${submission.task_id}`,
  });

  revalidatePath("/admin/submissions");
  revalidatePath(`/tasks/${submission.task_id}`);
  return {};
}

/** Signed URL so an admin can open a private submission file. */
export async function getSubmissionFileUrl(path: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("submissions")
    .createSignedUrl(path, 60 * 10);

  if (error) return { error: error.message };
  return { url: data.signedUrl };
}

export async function markCommentsRead(assignmentId: string) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("task_comments")
    .update({ is_read: true })
    .eq("assignment_id", assignmentId)
    .eq("is_admin_reply", false);

  revalidatePath("/admin/notifications");
  return {};
}
