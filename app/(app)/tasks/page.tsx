import Link from "next/link";
import { requireOnboardedUser } from "@/lib/auth";
import { getMyAssignments, summarize } from "@/lib/queries";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Eyebrow, EmptyState } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Progress";
import { cn, displayStatus } from "@/lib/utils";
import type { DisplayStatus } from "@/lib/types";

export const metadata = { title: "My Tasks — AI Savvy Founders" };

const FILTERS: { key: string; label: string; match?: DisplayStatus }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Not started", match: "pending" },
  { key: "in_progress", label: "In progress", match: "in_progress" },
  { key: "overdue", label: "Overdue", match: "overdue" },
  { key: "completed", label: "Completed", match: "completed" },
];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireOnboardedUser();
  const { status: statusParam } = await searchParams;

  const assignments = await getMyAssignments(user.id);
  const stats = summarize(assignments);

  const active = FILTERS.find((f) => f.key === statusParam) ?? FILTERS[0];
  const visible = active.match
    ? assignments.filter(
        (a) => displayStatus(a.status, a.task.deadline) === active.match,
      )
    : assignments;

  // Group by week; tasks without a week land in a trailing bucket.
  const byWeek = new Map<number, typeof visible>();
  for (const a of visible) {
    const week = a.task.week_number ?? 0;
    byWeek.set(week, [...(byWeek.get(week) ?? []), a]);
  }
  const weeks = [...byWeek.keys()].sort((a, b) => (a || 99) - (b || 99));

  return (
    <div className="space-y-9">
      <header>
        <Eyebrow>Your work</Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">
          My <span className="italic-verb">tasks</span>
        </h1>
        <div className="mt-5 max-w-md">
          <ProgressBar value={stats.percent} showLabel />
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/tasks" : `/tasks?status=${f.key}`}
            className={cn(
              "rounded-[7px] border px-3.5 py-1.5 text-sm transition-colors",
              active.key === f.key
                ? "border-terracotta bg-terracotta text-cream"
                : "border-sand text-smoke hover:bg-muted-warm hover:text-espresso",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing here"
          description={
            active.key === "all"
              ? "Your tasks will appear as soon as your admin assigns them."
              : "No tasks match this filter right now."
          }
        />
      ) : (
        weeks.map((week) => (
          <section key={week}>
            <h2 className="mb-4 text-lg">
              {week === 0 ? "Unscheduled" : `Week ${week}`}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {byWeek
                .get(week)!
                .map((a) => (
                  <TaskCard key={a.id} assignment={a} />
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
