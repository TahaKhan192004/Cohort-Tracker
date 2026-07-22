"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, getActiveCohort } from "@/lib/auth";
import { splitDelimitedLine } from "@/lib/utils";
import type { ActionState } from "./auth";
import type { TaskType } from "@/lib/types";

const TASK_TYPES: TaskType[] = ["action", "submission", "watch", "skill_build"];

function parseTaskType(value: string): TaskType {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (TASK_TYPES as string[]).includes(normalized)
    ? (normalized as TaskType)
    : "action";
}

/** Assign a task to everyone currently in the cohort. */
async function assignToCohort(taskId: string, cohortId: string) {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("cohort_members")
    .select("user_id")
    .eq("cohort_id", cohortId);

  if (!members?.length) return;

  await supabase.from("task_assignments").upsert(
    members.map((m) => ({
      task_id: taskId,
      user_id: m.user_id,
      status: "pending" as const,
    })),
    { onConflict: "task_id,user_id", ignoreDuplicates: true },
  );
}

function readTaskForm(formData: FormData) {
  const week = String(formData.get("week_number") ?? "").trim();
  const day = String(formData.get("day_number") ?? "").trim();
  const deadlineRaw = String(formData.get("deadline") ?? "").trim();

  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    week_number: week ? Number(week) : null,
    day_number: day ? Number(day) : null,
    // datetime-local has no timezone; treat it as the admin's local time.
    deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : "",
    task_type: parseTaskType(String(formData.get("task_type") ?? "action")),
    skill_name: String(formData.get("skill_name") ?? "").trim() || null,
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
  };
}

export async function createTask(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const cohort = await getActiveCohort();
  if (!cohort) return { error: "Create an active cohort first." };

  const values = readTaskForm(formData);
  if (!values.title) return { error: "Give the task a title." };
  if (!values.deadline) return { error: "Set a deadline." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...values, cohort_id: cohort.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await assignToCohort(data.id, cohort.id);

  revalidatePath("/admin/tasks");
  redirect("/admin/tasks");
}

export async function updateTask(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const values = readTaskForm(formData);

  if (!values.title) return { error: "Give the task a title." };
  if (!values.deadline) return { error: "Set a deadline." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  revalidatePath(`/admin/tasks/${id}`);
  return { success: "Task saved." };
}

/** Show or hide a task from participants, straight from the admin table. */
export async function setTaskVisibility(id: string, isPublished: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  revalidatePath(`/admin/tasks/${id}`);
  return {};
}

export async function deleteTask(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  // Assignments, comments, and submissions cascade from the FK definitions.
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  return {};
}

export async function deleteTasks(ids: string[]) {
  await requireAdmin();
  if (ids.length === 0) return {};

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().in("id", ids);
  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  return {};
}

export async function duplicateTask(id: string) {
  await requireAdmin();
  const cohort = await getActiveCohort();
  const supabase = await createClient();

  const { data: original } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (!original) return { error: "Task not found." };

  // Drop the identity/timestamp columns so the insert generates fresh ones.
  const rest = { ...original };
  delete rest.id;
  delete rest.created_at;
  delete rest.updated_at;

  const { data: copy, error } = await supabase
    .from("tasks")
    .insert({ ...rest, title: `${original.title} (copy)` })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (cohort) await assignToCohort(copy.id, cohort.id);

  revalidatePath("/admin/tasks");
  return {};
}

// ── Bulk creation ────────────────────────────────────────────────

export interface ParsedTaskRow {
  title: string;
  description: string;
  week_number: number | null;
  day_number: number | null;
  deadline: string;
  task_type: TaskType;
  error?: string;
}

/**
 * Parses pasted CSV/TSV into preview rows. Column order:
 * title, description, week, day, deadline, type
 */
export async function parseBulkTasks(raw: string): Promise<ParsedTaskRow[]> {
  await requireAdmin();

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // Tabs win when present — pasting from a spreadsheet is the common path.
  const delimiter = lines[0].includes("\t") ? "\t" : ",";

  const first = splitDelimitedLine(lines[0], delimiter);
  const hasHeader = first[0]?.toLowerCase() === "title";
  const body = hasHeader ? lines.slice(1) : lines;

  return body.map((line) => {
    const cells = splitDelimitedLine(line, delimiter);
    const [title = "", description = "", week = "", day = "", deadline = "", type = ""] =
      cells;

    const parsedDate = deadline ? new Date(deadline) : null;
    const validDate = parsedDate && !Number.isNaN(parsedDate.getTime());

    let error: string | undefined;
    if (!title) error = "Missing title";
    else if (!validDate) error = "Unreadable deadline";

    return {
      title,
      description,
      week_number: week ? Number(week) || null : null,
      day_number: day ? Number(day) || null : null,
      deadline: validDate ? parsedDate!.toISOString() : deadline,
      task_type: parseTaskType(type),
      error,
    };
  });
}

export async function createBulkTasks(
  rows: ParsedTaskRow[],
): Promise<{ error?: string; created?: number }> {
  await requireAdmin();
  const cohort = await getActiveCohort();
  if (!cohort) return { error: "Create an active cohort first." };

  const valid = rows.filter((r) => !r.error && r.title && r.deadline);
  if (valid.length === 0) return { error: "No valid rows to create." };

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("tasks")
    .insert(
      valid.map((r, i) => ({
        cohort_id: cohort.id,
        title: r.title,
        description: r.description || null,
        week_number: r.week_number,
        day_number: r.day_number,
        deadline: r.deadline,
        task_type: r.task_type,
        sort_order: i,
      })),
    )
    .select("id");

  if (error) return { error: error.message };

  const { data: members } = await supabase
    .from("cohort_members")
    .select("user_id")
    .eq("cohort_id", cohort.id);

  if (members?.length && inserted?.length) {
    const assignments = inserted.flatMap((task) =>
      members.map((m) => ({
        task_id: task.id,
        user_id: m.user_id,
        status: "pending" as const,
      })),
    );
    await supabase
      .from("task_assignments")
      .upsert(assignments, {
        onConflict: "task_id,user_id",
        ignoreDuplicates: true,
      });
  }

  revalidatePath("/admin/tasks");
  return { created: inserted?.length ?? 0 };
}
