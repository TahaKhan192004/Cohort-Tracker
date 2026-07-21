"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { notify, notifyAdmins } from "@/lib/notifications";
import type { ActionState } from "./auth";
import type { AssignmentStatus } from "@/lib/types";

/** Participant flips their own assignment between not started / in progress / done. */
export async function setAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus,
) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("task_assignments")
    .select("id, task_id, user_id")
    .eq("id", assignmentId)
    .single();

  if (!assignment || assignment.user_id !== user.id) {
    return { error: "That task isn't yours." };
  }

  const { error } = await supabase
    .from("task_assignments")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", assignmentId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${assignment.task_id}`);
  return {};
}

export async function postComment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const body = String(formData.get("body") ?? "").trim();
  const assignmentId = String(formData.get("assignment_id") ?? "");
  const taskId = String(formData.get("task_id") ?? "");

  if (!body) return { error: "Write something first." };

  const isAdminReply = user.role === "admin";

  const { error } = await supabase.from("task_comments").insert({
    task_id: taskId,
    user_id: user.id,
    assignment_id: assignmentId,
    body,
    is_admin_reply: isAdminReply,
  });

  if (error) return { error: error.message };

  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", taskId)
    .single();

  if (isAdminReply) {
    // Reply lands in the participant's thread — notify whoever owns it.
    const { data: assignment } = await supabase
      .from("task_assignments")
      .select("user_id")
      .eq("id", assignmentId)
      .single();

    if (assignment) {
      await notify({
        recipientId: assignment.user_id,
        type: "feedback_given",
        title: "Umaima replied to your question",
        body: task?.title ?? null,
        link: `/tasks/${taskId}`,
      });
    }
  } else {
    await notifyAdmins({
      type: "new_comment",
      title: `${user.full_name} asked a question`,
      body: task?.title ?? null,
      link: `/admin/users/${user.id}`,
    });
  }

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/admin/notifications");
  return { success: "Posted." };
}

export async function submitWork(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const taskId = String(formData.get("task_id") ?? "");
  const text = String(formData.get("submission_text") ?? "").trim();
  const link = String(formData.get("link_url") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!text && !link && (!file || file.size === 0)) {
    return { error: "Add a note, a link, or a file before submitting." };
  }

  let fileUrl: string | null = null;

  if (file && file.size > 0) {
    if (file.size > 20 * 1024 * 1024) {
      return { error: "Files need to be under 20MB." };
    }
    // Storage RLS keys off the first path segment being the user's own uid.
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${user.id}/${taskId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("submissions")
      .upload(path, file, { upsert: false });

    if (uploadError) return { error: `Upload failed: ${uploadError.message}` };
    fileUrl = path;
  }

  // One submission per task per participant — resubmitting replaces it and
  // sends the work back to the review queue.
  const { error } = await supabase.from("submissions").upsert(
    {
      task_id: taskId,
      user_id: user.id,
      submission_text: text || null,
      link_url: link || null,
      ...(fileUrl ? { file_url: fileUrl } : {}),
      status: "submitted",
      submitted_at: new Date().toISOString(),
      admin_feedback: null,
      reviewed_at: null,
    },
    { onConflict: "task_id,user_id" },
  );

  if (error) return { error: error.message };

  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", taskId)
    .single();

  await notifyAdmins({
    type: "submission_received",
    title: `${user.full_name} submitted work`,
    body: task?.title ?? null,
    link: "/admin/submissions",
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/admin/submissions");
  return { success: "Submitted. Umaima will review it shortly." };
}
