import "server-only";

import { createClient } from "./supabase/server";
import { displayStatus } from "./utils";
import type { AssignmentWithTask, DisplayStatus, ResourceType } from "./types";

export interface ResourceOption {
  id: string;
  title: string;
  resource_type: ResourceType;
}

/** Just enough of each resource to build a link picker in the task form. */
export async function getCohortResourceOptions(
  cohortId: string,
): Promise<ResourceOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("id, title, resource_type")
    .eq("cohort_id", cohortId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []) as ResourceOption[];
}

/** Every assignment for a participant, joined with its task, deadline order. */
export async function getMyAssignments(
  userId: string,
): Promise<AssignmentWithTask[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_assignments")
    .select("*, task:tasks(*)")
    .eq("user_id", userId);

  const rows = (data ?? []) as unknown as AssignmentWithTask[];

  return rows
    .filter((r) => r.task)
    .sort(
      (a, b) =>
        new Date(a.task.deadline).getTime() - new Date(b.task.deadline).getTime(),
    );
}

export interface ProgressSummary {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  pending: number;
  percent: number;
}

export function summarize(assignments: AssignmentWithTask[]): ProgressSummary {
  const counts: Record<DisplayStatus, number> = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
  };

  for (const a of assignments) {
    counts[displayStatus(a.status, a.task.deadline)]++;
  }

  const total = assignments.length;
  return {
    total,
    completed: counts.completed,
    inProgress: counts.in_progress,
    overdue: counts.overdue,
    pending: counts.pending,
    percent: total === 0 ? 0 : Math.round((counts.completed / total) * 100),
  };
}

/**
 * Per-participant progress for the admin tables. Pulls assignments for the
 * cohort in one query and folds them by user, rather than N queries.
 */
export async function getCohortProgress(cohortId: string) {
  const supabase = await createClient();

  const [{ data: memberRows }, { data: assignmentRows }] = await Promise.all([
    supabase
      .from("cohort_members")
      .select("user:users(*)")
      .eq("cohort_id", cohortId),
    supabase
      .from("task_assignments")
      .select("user_id, status, task:tasks!inner(id, deadline, cohort_id)")
      .eq("task.cohort_id", cohortId),
  ]);

  type Row = {
    user_id: string;
    status: "pending" | "in_progress" | "completed";
    task: { deadline: string };
  };

  const byUser = new Map<string, { completed: number; overdue: number; total: number }>();

  for (const row of (assignmentRows ?? []) as unknown as Row[]) {
    if (!row.task) continue;
    const entry = byUser.get(row.user_id) ?? {
      completed: 0,
      overdue: 0,
      total: 0,
    };
    entry.total++;
    const status = displayStatus(row.status, row.task.deadline);
    if (status === "completed") entry.completed++;
    if (status === "overdue") entry.overdue++;
    byUser.set(row.user_id, entry);
  }

  const members = ((memberRows ?? []) as unknown as {
    user: import("./types").AppUser;
  }[])
    .map((m) => m.user)
    .filter(Boolean);

  return members.map((user) => {
    const stats = byUser.get(user.id) ?? { completed: 0, overdue: 0, total: 0 };
    return {
      user,
      ...stats,
      percent:
        stats.total === 0
          ? 0
          : Math.round((stats.completed / stats.total) * 100),
    };
  });
}
