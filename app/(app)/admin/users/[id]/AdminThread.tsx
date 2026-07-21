"use client";

import Link from "next/link";
import { CommentThread, type ThreadComment } from "@/components/tasks/CommentThread";

export function AdminThread({
  assignmentId,
  taskId,
  taskTitle,
  participantName,
  comments,
}: {
  assignmentId: string;
  taskId: string;
  taskTitle: string;
  participantName: string;
  comments: ThreadComment[];
}) {
  return (
    <div className="rounded-[7px] border border-sand p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-espresso">{taskTitle}</p>
        <Link
          href={`/admin/tasks/${taskId}`}
          className="text-xs text-smoke hover:text-terracotta"
        >
          View task →
        </Link>
      </div>
      <p className="mb-4 text-xs text-smoke">Thread with {participantName}</p>
      <CommentThread
        comments={comments}
        taskId={taskId}
        assignmentId={assignmentId}
        asAdmin
      />
    </div>
  );
}
