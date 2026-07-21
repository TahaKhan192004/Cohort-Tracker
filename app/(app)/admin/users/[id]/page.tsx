import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Eyebrow, EmptyState } from "@/components/ui/Card";
import { StatusBadge, SubmissionStatusBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import { TableWrap, Th, Td, Tr } from "@/components/ui/Table";
import { AdminThread } from "./AdminThread";
import { ResetPasswordButton } from "./ResetPasswordButton";
import {
  displayStatus,
  formatDate,
  formatDateTime,
  percent,
  relativeTime,
} from "@/lib/utils";
import type {
  AppUser,
  AssignmentWithTask,
  Submission,
  TaskComment,
} from "@/lib/types";

export default async function AdminUserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const user = userRow as AppUser | null;
  if (!user) notFound();

  const [{ data: assignmentRows }, { data: submissionRows }] = await Promise.all([
    supabase.from("task_assignments").select("*, task:tasks(*)").eq("user_id", id),
    supabase
      .from("submissions")
      .select("*, task:tasks(title)")
      .eq("user_id", id)
      .order("submitted_at", { ascending: false }),
  ]);

  // Threads hang off assignment ids, so this has to wait for the query above.
  const assignmentIds = ((assignmentRows ?? []) as { id: string }[]).map(
    (a) => a.id,
  );
  const { data: commentRows } = assignmentIds.length
    ? await supabase
        .from("task_comments")
        .select("*, task:tasks(title)")
        .in("assignment_id", assignmentIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const assignments = ((assignmentRows ?? []) as unknown as AssignmentWithTask[])
    .filter((a) => a.task)
    .sort(
      (a, b) =>
        new Date(a.task.deadline).getTime() - new Date(b.task.deadline).getTime(),
    );

  const completed = assignments.filter(
    (a) => displayStatus(a.status, a.task.deadline) === "completed",
  ).length;
  const overdue = assignments.filter(
    (a) => displayStatus(a.status, a.task.deadline) === "overdue",
  ).length;

  const submissions = (submissionRows ?? []) as unknown as (Submission & {
    task: { title: string } | null;
  })[];

  const comments = (commentRows ?? []) as unknown as (TaskComment & {
    task: { title: string } | null;
  })[];

  // Group the conversation by assignment so each task has its own thread.
  const threads = new Map<string, typeof comments>();
  for (const c of comments) {
    threads.set(c.assignment_id, [...(threads.get(c.assignment_id) ?? []), c]);
  }

  return (
    <div className="space-y-9">
      <div>
        <Link href="/admin/users" className="text-sm text-smoke hover:text-terracotta">
          ← Participants
        </Link>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Participant</Eyebrow>
          <h1 className="mt-3 text-3xl leading-tight">{user.full_name}</h1>
          <p className="mt-2 text-sm text-smoke">
            {user.email} · @{user.username} · joined {formatDate(user.created_at)}
          </p>
          <p className="mt-1 text-sm text-smoke">
            Last active{" "}
            {user.last_active_at ? relativeTime(user.last_active_at) : "never"}
          </p>
        </div>
        <ResetPasswordButton userId={user.id} />
      </header>

      <Card className="max-w-sm">
        <CardHeader title="Progress" />
        <ProgressBar value={percent(completed, assignments.length)} showLabel />
        <dl className="mt-5 space-y-2 text-sm">
          <Stat label="Completed" value={`${completed} / ${assignments.length}`} />
          <Stat label="Overdue" value={overdue} accent={overdue > 0} />
          <Stat label="Submissions" value={submissions.length} />
          <Stat
            label="Questions asked"
            value={comments.filter((c) => !c.is_admin_reply).length}
          />
        </dl>
      </Card>

      <Card>
        <CardHeader title="Tasks" />
        {assignments.length === 0 ? (
          <p className="text-sm text-smoke">No tasks assigned yet.</p>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Task</Th>
                <Th>Week</Th>
                <Th>Deadline</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    <Link
                      href={`/admin/tasks/${a.task.id}`}
                      className="text-espresso hover:text-terracotta"
                    >
                      {a.task.title}
                    </Link>
                  </Td>
                  <Td className="text-smoke">{a.task.week_number ?? "—"}</Td>
                  <Td className="text-smoke">{formatDateTime(a.task.deadline)}</Td>
                  <Td>
                    <StatusBadge
                      status={displayStatus(a.status, a.task.deadline)}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Card>
        <CardHeader title="Submissions" />
        {submissions.length === 0 ? (
          <p className="text-sm text-smoke">Nothing submitted yet.</p>
        ) : (
          <ul className="space-y-3">
            {submissions.map((s) => (
              <li
                key={s.id}
                className="rounded-[7px] border border-sand p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-espresso">
                    {s.task?.title ?? "Task"}
                  </p>
                  <SubmissionStatusBadge status={s.status} />
                </div>
                <p className="mt-1 text-xs text-smoke">
                  {formatDateTime(s.submitted_at)}
                </p>
                {s.submission_text ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-espresso">
                    {s.submission_text}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Question threads"
          description="Each thread is private between you and this participant."
        />
        {threads.size === 0 ? (
          <EmptyState title="No questions yet" />
        ) : (
          <div className="space-y-7">
            {[...threads.entries()].map(([assignmentId, thread]) => (
              <AdminThread
                key={assignmentId}
                assignmentId={assignmentId}
                taskId={thread[0].task_id}
                taskTitle={thread[0].task?.title ?? "Task"}
                participantName={user.full_name}
                comments={thread.map((c) => ({
                  ...c,
                  authorName: c.is_admin_reply ? "You" : user.full_name,
                }))}
              />
            ))}
          </div>
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
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-smoke">{label}</dt>
      <dd className={accent ? "text-terracotta" : "text-espresso"}>{value}</dd>
    </div>
  );
}
