import Link from "next/link";
import { requireOnboardedUser, getMyCohort, touchLastActive } from "@/lib/auth";
import { getMyAssignments, summarize } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { TaskCard } from "@/components/tasks/TaskCard";
import { AnnouncementBar } from "@/components/dashboard/AnnouncementBar";
import { Card, CardHeader, Eyebrow, EmptyState } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/Progress";
import { ButtonLink } from "@/components/ui/Button";
import {
  currentWeek,
  displayStatus,
  isToday,
  relativeTime,
  toEmbedUrl,
} from "@/lib/utils";
import type { AppNotification, Resource } from "@/lib/types";

export const metadata = { title: "Dashboard — AI Savvy Founders" };

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const [cohort, assignments] = await Promise.all([
    getMyCohort(user.id),
    getMyAssignments(user.id),
    touchLastActive(user.id),
  ]);

  const stats = summarize(assignments);

  // "Today's focus" is anything overdue or due today, deadline order.
  const focus = assignments.filter((a) => {
    const status = displayStatus(a.status, a.task.deadline);
    return status === "overdue" || (status !== "completed" && isToday(a.task.deadline));
  });

  const upcoming = assignments
    .filter(
      (a) =>
        displayStatus(a.status, a.task.deadline) !== "completed" &&
        !focus.includes(a),
    )
    .slice(0, 4);

  const supabase = await createClient();
  const [{ data: notificationRows }, { data: replayRow }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    // Newest call recording drives the announcement bar, so posting a new
    // replay updates the dashboard without a code change.
    cohort
      ? supabase
          .from("resources")
          .select("*")
          .eq("cohort_id", cohort.id)
          .eq("resource_type", "recording")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const notifications = (notificationRows ?? []) as AppNotification[];
  const replay = replayRow as Resource | null;

  const week = cohort ? currentWeek(cohort.start_date) : null;

  return (
    <div className="space-y-10">
      {replay ? (
        <AnnouncementBar
          resource={replay}
          embedUrl={replay.content_url ? toEmbedUrl(replay.content_url) : null}
        />
      ) : null}

      <header>
        <Eyebrow>{cohort?.name ?? "Your cohort"}</Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">
          Welcome back, {user.full_name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-smoke">
          {week ? `Week ${week} · ` : ""}
          {stats.completed} of {stats.total} tasks done
          {stats.overdue > 0 ? ` · ${stats.overdue} overdue` : ""}
        </p>
      </header>

      <Card className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
        <ProgressRing value={stats.percent} />
        <div className="grid flex-1 grid-cols-2 gap-5 sm:grid-cols-4">
          <Stat label="Completed" value={stats.completed} />
          <Stat label="In progress" value={stats.inProgress} />
          <Stat label="Not started" value={stats.pending} />
          <Stat label="Overdue" value={stats.overdue} accent={stats.overdue > 0} />
        </div>
      </Card>

      <section>
        <CardHeader
          title={
            <>
              Today&apos;s <span className="italic-verb">focus</span>
            </>
          }
          description="Overdue work and anything due before the day is out."
          action={
            <ButtonLink href="/tasks" variant="secondary" size="sm">
              All tasks
            </ButtonLink>
          }
        />
        {focus.length === 0 ? (
          <EmptyState
            title="Nothing due today"
            description="You're on top of it. Take a look at what's coming up next."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {focus.map((a) => (
              <TaskCard key={a.id} assignment={a} />
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 0 ? (
        <section>
          <CardHeader title="Coming up" />
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((a) => (
              <TaskCard key={a.id} assignment={a} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="Recent activity" />
          {notifications.length === 0 ? (
            <p className="text-sm text-smoke">No notifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link ?? "#"}
                    className="block rounded-[7px] px-3 py-2 transition-colors hover:bg-muted-warm/60"
                  >
                    <p className="text-sm text-espresso">{n.title}</p>
                    <p className="mt-0.5 text-xs text-smoke">
                      {relativeTime(n.created_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Resources"
            description="Recordings, SOPs, and skill walkthroughs."
          />
          <ButtonLink href="/resources" variant="secondary" size="sm">
            Open the library
          </ButtonLink>
        </Card>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className={`font-display text-2xl tabular-nums ${
          accent ? "text-terracotta" : "text-umber"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-smoke">{label}</p>
    </div>
  );
}
