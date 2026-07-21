import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Eyebrow, EmptyState } from "@/components/ui/Card";
import { MarkReadButton } from "./MarkReadButton";
import { relativeTime } from "@/lib/utils";
import type { TaskComment } from "@/lib/types";

export const metadata = { title: "Activity — Admin" };

type FeedComment = TaskComment & {
  user: { id: string; full_name: string } | null;
  task: { id: string; title: string } | null;
};

export default async function AdminNotificationsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("task_comments")
    .select("*, user:users(id, full_name), task:tasks(id, title)")
    .eq("is_admin_reply", false)
    .order("created_at", { ascending: false })
    .limit(100);

  const comments = (data ?? []) as unknown as FeedComment[];
  const unread = comments.filter((c) => !c.is_read);
  const read = comments.filter((c) => c.is_read);

  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Activity</Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">
          Questions from <span className="italic-verb">participants</span>
        </h1>
        <p className="mt-2 text-sm text-smoke">
          {unread.length} unread · {comments.length} total
        </p>
      </header>

      <Card>
        <CardHeader title="Unread" />
        {unread.length === 0 ? (
          <EmptyState title="All caught up" description="No unread questions." />
        ) : (
          <ul className="space-y-3">
            {unread.map((comment) => (
              <CommentRow key={comment.id} comment={comment} />
            ))}
          </ul>
        )}
      </Card>

      {read.length > 0 ? (
        <Card>
          <CardHeader title="Earlier" />
          <ul className="space-y-3">
            {read.slice(0, 30).map((comment) => (
              <CommentRow key={comment.id} comment={comment} muted />
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function CommentRow({
  comment,
  muted = false,
}: {
  comment: FeedComment;
  muted?: boolean;
}) {
  return (
    <li
      className={`rounded-[7px] border p-4 ${
        muted ? "border-sand/70" : "border-ring-accent/40 bg-ring-accent/8"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-espresso">
          {comment.user ? (
            <Link
              href={`/admin/users/${comment.user.id}`}
              className="hover:text-terracotta"
            >
              {comment.user.full_name}
            </Link>
          ) : (
            "Unknown"
          )}
          <span className="text-smoke"> on </span>
          {comment.task ? (
            <Link
              href={`/admin/tasks/${comment.task.id}`}
              className="hover:text-terracotta"
            >
              {comment.task.title}
            </Link>
          ) : (
            "a task"
          )}
        </p>
        <p className="text-xs text-smoke">{relativeTime(comment.created_at)}</p>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm text-espresso">
        {comment.body}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {comment.user ? (
          <Link
            href={`/admin/users/${comment.user.id}`}
            className="text-xs text-terracotta hover:underline"
          >
            Reply in their thread →
          </Link>
        ) : null}
        {!comment.is_read ? (
          <MarkReadButton assignmentId={comment.assignment_id} />
        ) : null}
      </div>
    </li>
  );
}
