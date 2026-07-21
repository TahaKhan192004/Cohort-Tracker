"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { postComment } from "@/app/actions/tasks";
import type { ActionState } from "@/app/actions/auth";
import { Textarea, FormError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { relativeTime } from "@/lib/utils";
import type { TaskComment } from "@/lib/types";

export interface ThreadComment extends TaskComment {
  authorName: string;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Sending…" : label}
    </Button>
  );
}

export function CommentThread({
  comments,
  taskId,
  assignmentId,
  asAdmin = false,
}: {
  comments: ThreadComment[];
  taskId: string;
  assignmentId: string;
  asAdmin?: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    postComment,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the box once the server confirms the post.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <div className="space-y-5">
      {comments.length === 0 ? (
        <p className="text-sm text-smoke">
          {asAdmin
            ? "No messages in this thread yet."
            : "Stuck on this one? Ask here — only you and Umaima can see this thread."}
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={`rounded-[7px] border p-4 ${
                comment.is_admin_reply
                  ? "border-ring-accent/40 bg-ring-accent/10"
                  : "border-sand bg-white/60"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-espresso">
                  {comment.authorName}
                  {comment.is_admin_reply ? (
                    <span className="ml-2 text-xs text-terracotta">Admin</span>
                  ) : null}
                </p>
                <p className="text-xs text-smoke">
                  {relativeTime(comment.created_at)}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-espresso">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={formAction} className="space-y-3">
        <input type="hidden" name="task_id" value={taskId} />
        <input type="hidden" name="assignment_id" value={assignmentId} />
        <Textarea
          name="body"
          required
          placeholder={
            asAdmin ? "Write a reply…" : "Ask a question about this task…"
          }
          className="min-h-24"
        />
        <FormError>{state.error}</FormError>
        <SubmitButton label={asAdmin ? "Send reply" : "Post question"} />
      </form>
    </div>
  );
}
