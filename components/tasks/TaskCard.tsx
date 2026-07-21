import Link from "next/link";
import { StatusBadge, TaskTypeBadge } from "@/components/ui/Badge";
import { displayStatus, formatDateTime, relativeTime, urgency } from "@/lib/utils";
import type { AssignmentWithTask } from "@/lib/types";

const DEADLINE_TONE = {
  ok: "text-smoke",
  soon: "text-[#8A5D1E]",
  late: "text-terracotta",
} as const;

export function TaskCard({
  assignment,
  unreadReplies = 0,
}: {
  assignment: AssignmentWithTask;
  unreadReplies?: number;
}) {
  const { task } = assignment;
  const status = displayStatus(assignment.status, task.deadline);
  const tone = DEADLINE_TONE[urgency(task.deadline)];

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block rounded-[7px] border border-sand bg-white/60 p-5 transition-colors hover:border-ring-accent"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-display text-lg text-umber">
            {task.title}
          </p>
          <p className={`mt-1 text-sm ${tone}`}>
            Due {formatDateTime(task.deadline)}
            <span className="text-smoke/70"> · {relativeTime(task.deadline)}</span>
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TaskTypeBadge type={task.task_type} />
        {task.week_number ? (
          <span className="text-xs text-smoke">
            Week {task.week_number}
            {task.day_number ? ` · Day ${task.day_number}` : ""}
          </span>
        ) : null}
        {unreadReplies > 0 ? (
          <span className="ml-auto text-xs text-terracotta">
            {unreadReplies} new {unreadReplies === 1 ? "reply" : "replies"}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
