import { requireAdmin, getActiveCohort } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Eyebrow, EmptyState } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { TaskTable, type AdminTaskRow } from "./TaskTable";
import { displayStatus } from "@/lib/utils";
import type { Task } from "@/lib/types";

export const metadata = { title: "Tasks — Admin" };

export default async function AdminTasksPage() {
  await requireAdmin();
  const cohort = await getActiveCohort();

  if (!cohort) {
    return (
      <div className="space-y-8">
        <header>
          <Eyebrow>Admin</Eyebrow>
          <h1 className="mt-3 text-3xl leading-tight">Tasks</h1>
        </header>
        <EmptyState
          title="No active cohort"
          description="Tasks belong to a cohort, so create one first."
          action={<ButtonLink href="/admin/cohorts">Create a cohort</ButtonLink>}
        />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: taskRows }, { data: assignmentRows }, { count: memberCount }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("cohort_id", cohort.id)
        .order("week_number", { ascending: true, nullsFirst: false })
        .order("day_number", { ascending: true, nullsFirst: false })
        .order("sort_order", { ascending: true }),
      supabase
        .from("task_assignments")
        .select("task_id, status, task:tasks!inner(deadline, cohort_id)")
        .eq("task.cohort_id", cohort.id),
      supabase
        .from("cohort_members")
        .select("id", { count: "exact", head: true })
        .eq("cohort_id", cohort.id),
    ]);

  const tasks = (taskRows ?? []) as Task[];

  // Fold assignments into per-task completion counts in one pass.
  type Row = {
    task_id: string;
    status: "pending" | "in_progress" | "completed";
    task: { deadline: string };
  };
  const counts = new Map<string, { completed: number; overdue: number }>();
  for (const row of (assignmentRows ?? []) as unknown as Row[]) {
    if (!row.task) continue;
    const entry = counts.get(row.task_id) ?? { completed: 0, overdue: 0 };
    const status = displayStatus(row.status, row.task.deadline);
    if (status === "completed") entry.completed++;
    if (status === "overdue") entry.overdue++;
    counts.set(row.task_id, entry);
  }

  const rows: AdminTaskRow[] = tasks.map((task) => ({
    task,
    completed: counts.get(task.id)?.completed ?? 0,
    overdue: counts.get(task.id)?.overdue ?? 0,
    assigned: memberCount ?? 0,
  }));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{cohort.name}</Eyebrow>
          <h1 className="mt-3 text-3xl leading-tight">Tasks</h1>
          <p className="mt-2 text-sm text-smoke">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"} · {memberCount ?? 0}{" "}
            participants
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/admin/tasks/bulk" variant="secondary">
            Bulk add
          </ButtonLink>
          <ButtonLink href="/admin/tasks/create">Add task</ButtonLink>
        </div>
      </header>

      <Card className="p-0">
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No tasks yet"
              description="Add them one at a time, or paste a whole schedule at once."
              action={
                <div className="flex justify-center gap-2">
                  <ButtonLink href="/admin/tasks/create" size="sm">
                    Add task
                  </ButtonLink>
                  <ButtonLink href="/admin/tasks/bulk" variant="secondary" size="sm">
                    Bulk add
                  </ButtonLink>
                </div>
              }
            />
          </div>
        ) : (
          <TaskTable rows={rows} />
        )}
      </Card>
    </div>
  );
}
