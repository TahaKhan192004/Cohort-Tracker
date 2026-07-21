import Link from "next/link";
import { requireAdmin, getActiveCohort } from "@/lib/auth";
import { getCohortProgress } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Eyebrow, EmptyState } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Progress";
import { TableWrap, Th, Td, Tr } from "@/components/ui/Table";
import { formatDate, relativeTime, percent } from "@/lib/utils";

export const metadata = { title: "Admin — AI Savvy Founders" };

export default async function AdminDashboard() {
  await requireAdmin();
  const cohort = await getActiveCohort();

  if (!cohort) {
    return (
      <div className="space-y-8">
        <header>
          <Eyebrow>Admin</Eyebrow>
          <h1 className="mt-3 text-3xl leading-tight">
            Cohort <span className="italic-verb">overview</span>
          </h1>
        </header>
        <EmptyState
          title="No active cohort yet"
          description="Create one to start adding participants, tasks, and resources."
          action={<ButtonLink href="/admin/cohorts">Create a cohort</ButtonLink>}
        />
      </div>
    );
  }

  const supabase = await createClient();
  const [
    progress,
    { count: pendingSubmissions },
    { count: unreadComments },
    { count: totalTasks },
    { data: recentSubmissions },
    { data: recentComments },
  ] = await Promise.all([
    getCohortProgress(cohort.id),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("task_comments")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .eq("is_admin_reply", false),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("cohort_id", cohort.id),
    supabase
      .from("submissions")
      .select("id, submitted_at, status, user:users(full_name), task:tasks(title)")
      .order("submitted_at", { ascending: false })
      .limit(5),
    supabase
      .from("task_comments")
      .select("id, created_at, body, user:users(full_name), task:tasks(title)")
      .eq("is_admin_reply", false)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const completedTotal = progress.reduce((sum, p) => sum + p.completed, 0);
  const assignmentTotal = progress.reduce((sum, p) => sum + p.total, 0);
  const overdueTotal = progress.reduce((sum, p) => sum + p.overdue, 0);

  type ActivityRow = {
    id: string;
    user: { full_name: string } | null;
    task: { title: string } | null;
  };

  const submissions = (recentSubmissions ?? []) as unknown as (ActivityRow & {
    submitted_at: string;
  })[];
  const comments = (recentComments ?? []) as unknown as (ActivityRow & {
    created_at: string;
    body: string;
  })[];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{cohort.name}</Eyebrow>
          <h1 className="mt-3 text-3xl leading-tight">
            Cohort <span className="italic-verb">overview</span>
          </h1>
          <p className="mt-2 text-sm text-smoke">
            {formatDate(cohort.start_date)} — {formatDate(cohort.end_date)}
          </p>
        </div>
        <ButtonLink href="/admin/users/create">Add participant</ButtonLink>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Participants" value={progress.length} href="/admin/users" />
        <StatCard
          label="Completion"
          value={`${percent(completedTotal, assignmentTotal)}%`}
          sub={`${completedTotal} of ${assignmentTotal} assignments`}
        />
        <StatCard
          label="Pending review"
          value={pendingSubmissions ?? 0}
          href="/admin/submissions"
          accent={(pendingSubmissions ?? 0) > 0}
        />
        <StatCard
          label="Unread questions"
          value={unreadComments ?? 0}
          href="/admin/notifications"
          accent={(unreadComments ?? 0) > 0}
        />
      </div>

      <Card>
        <CardHeader
          title="Participants"
          description={`${totalTasks ?? 0} tasks in this cohort · ${overdueTotal} overdue across everyone`}
          action={
            <ButtonLink href="/admin/users" variant="secondary" size="sm">
              Manage
            </ButtonLink>
          }
        />
        {progress.length === 0 ? (
          <EmptyState
            title="No participants yet"
            action={
              <ButtonLink href="/admin/users/create" size="sm">
                Add the first one
              </ButtonLink>
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th className="w-48">Progress</Th>
                <Th>Overdue</Th>
                <Th>Last active</Th>
              </tr>
            </thead>
            <tbody>
              {progress
                .slice()
                .sort((a, b) => b.percent - a.percent)
                .map((row) => (
                  <Tr key={row.user.id}>
                    <Td>
                      <Link
                        href={`/admin/users/${row.user.id}`}
                        className="text-espresso hover:text-terracotta"
                      >
                        {row.user.full_name}
                      </Link>
                    </Td>
                    <Td>
                      <ProgressBar value={row.percent} showLabel />
                      <p className="mt-1 text-xs text-smoke">
                        {row.completed}/{row.total}
                      </p>
                    </Td>
                    <Td>
                      <span
                        className={
                          row.overdue > 0 ? "text-terracotta" : "text-smoke"
                        }
                      >
                        {row.overdue}
                      </span>
                    </Td>
                    <Td className="text-smoke">
                      {row.user.last_active_at
                        ? relativeTime(row.user.last_active_at)
                        : "Never"}
                    </Td>
                  </Tr>
                ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Latest submissions" />
          {submissions.length === 0 ? (
            <p className="text-sm text-smoke">Nothing submitted yet.</p>
          ) : (
            <ul className="space-y-3">
              {submissions.map((s) => (
                <li key={s.id} className="border-b border-sand/60 pb-3 last:border-0">
                  <p className="text-sm text-espresso">
                    {s.user?.full_name ?? "Unknown"} — {s.task?.title ?? "task"}
                  </p>
                  <p className="mt-0.5 text-xs text-smoke">
                    {relativeTime(s.submitted_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Latest questions" />
          {comments.length === 0 ? (
            <p className="text-sm text-smoke">No questions yet.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="border-b border-sand/60 pb-3 last:border-0">
                  <p className="text-sm text-espresso">
                    {c.user?.full_name ?? "Unknown"} — {c.task?.title ?? "task"}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-smoke">{c.body}</p>
                  <p className="mt-0.5 text-xs text-smoke/80">
                    {relativeTime(c.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  href,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  accent?: boolean;
}) {
  const body = (
    <div className="rounded-[7px] border border-sand bg-white/60 p-5 transition-colors hover:border-ring-accent">
      <p className="text-xs uppercase tracking-[0.1em] text-smoke">{label}</p>
      <p
        className={`mt-2 font-display text-3xl tabular-nums ${
          accent ? "text-terracotta" : "text-umber"
        }`}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-smoke">{sub}</p> : null}
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
