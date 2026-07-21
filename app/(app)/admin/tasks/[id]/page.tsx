import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Eyebrow } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { TableWrap, Th, Td, Tr } from "@/components/ui/Table";
import { TaskForm } from "@/components/admin/TaskForm";
import { displayStatus, formatDateTime, percent } from "@/lib/utils";
import type { AppUser, Task, TaskAssignment } from "@/lib/types";

export default async function AdminTaskDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: taskRow } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const task = taskRow as Task | null;
  if (!task) notFound();

  const [{ data: assignmentRows }, { count: submissionCount }] = await Promise.all([
    supabase
      .from("task_assignments")
      .select("*, user:users(id, full_name)")
      .eq("task_id", id),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("task_id", id),
  ]);

  const assignments = (assignmentRows ?? []) as unknown as (TaskAssignment & {
    user: Pick<AppUser, "id" | "full_name"> | null;
  })[];

  const completed = assignments.filter(
    (a) => displayStatus(a.status, task.deadline) === "completed",
  ).length;
  const overdue = assignments.filter(
    (a) => displayStatus(a.status, task.deadline) === "overdue",
  ).length;

  // Average turnaround, measured from when the task was created.
  const completionTimes = assignments
    .filter((a) => a.completed_at)
    .map(
      (a) =>
        new Date(a.completed_at!).getTime() - new Date(task.created_at).getTime(),
    );
  const avgDays =
    completionTimes.length > 0
      ? (
          completionTimes.reduce((sum, ms) => sum + ms, 0) /
          completionTimes.length /
          864e5
        ).toFixed(1)
      : null;

  return (
    <div className="space-y-9">
      <div>
        <Link href="/admin/tasks" className="text-sm text-smoke hover:text-terracotta">
          ← Tasks
        </Link>
      </div>

      <header>
        <Eyebrow>
          {task.week_number ? `Week ${task.week_number}` : "Task"}
          {task.day_number ? ` · Day ${task.day_number}` : ""}
        </Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">{task.title}</h1>
        <p className="mt-2 text-sm text-smoke">
          Due {formatDateTime(task.deadline)}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Assigned" value={assignments.length} />
        <Stat
          label="Completed"
          value={`${completed} · ${percent(completed, assignments.length)}%`}
        />
        <Stat label="Overdue" value={overdue} accent={overdue > 0} />
        <Stat
          label="Submitted"
          value={task.task_type === "submission" ? (submissionCount ?? 0) : "—"}
        />
      </div>

      {avgDays ? (
        <p className="text-sm text-smoke">
          Average time to completion: {avgDays} days after the task was created.
        </p>
      ) : null}

      <Card>
        <CardHeader title="Edit task" />
        <TaskForm task={task} />
      </Card>

      <Card>
        <CardHeader
          title="Who's done it"
          description="Status for every participant on this task."
        />
        {assignments.length === 0 ? (
          <p className="text-sm text-smoke">Nobody is assigned to this task.</p>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Participant</Th>
                <Th>Status</Th>
                <Th>Completed</Th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    {a.user ? (
                      <Link
                        href={`/admin/users/${a.user.id}`}
                        className="text-espresso hover:text-terracotta"
                      >
                        {a.user.full_name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    <StatusBadge
                      status={displayStatus(a.status, task.deadline)}
                    />
                  </Td>
                  <Td className="text-smoke">
                    {a.completed_at ? formatDateTime(a.completed_at) : "—"}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[7px] border border-sand bg-white/60 p-5">
      <p className="text-xs uppercase tracking-[0.1em] text-smoke">{label}</p>
      <p
        className={`mt-2 font-display text-2xl tabular-nums ${
          accent ? "text-terracotta" : "text-umber"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
