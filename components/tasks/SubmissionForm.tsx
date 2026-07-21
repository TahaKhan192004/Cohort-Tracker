"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitWork } from "@/app/actions/tasks";
import type { ActionState } from "@/app/actions/auth";
import {
  Field,
  Input,
  Textarea,
  FormError,
  FormSuccess,
} from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import type { Submission } from "@/lib/types";

function SubmitButton({ resubmit }: { resubmit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting…" : resubmit ? "Resubmit work" : "Submit work"}
    </Button>
  );
}

export function SubmissionForm({
  taskId,
  submission,
}: {
  taskId: string;
  submission: Submission | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    submitWork,
    {},
  );

  return (
    <div className="space-y-5">
      {submission ? (
        <div className="rounded-[7px] border border-sand bg-muted-warm/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-espresso">
              Submitted {formatDateTime(submission.submitted_at)}
            </p>
            <SubmissionStatusBadge status={submission.status} />
          </div>
          {submission.admin_feedback ? (
            <div className="mt-3 border-t border-sand pt-3">
              <p className="text-xs uppercase tracking-[0.1em] text-terracotta">
                Feedback
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-espresso">
                {submission.admin_feedback}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="task_id" value={taskId} />

        <Field label="Notes" htmlFor="submission_text">
          <Textarea
            id="submission_text"
            name="submission_text"
            defaultValue={submission?.submission_text ?? ""}
            placeholder="What you did, what you'd like feedback on."
          />
        </Field>

        <Field label="Link" htmlFor="link_url" hint="optional">
          <Input
            id="link_url"
            name="link_url"
            type="url"
            defaultValue={submission?.link_url ?? ""}
            placeholder="https://…"
          />
        </Field>

        <Field label="File" htmlFor="file" hint="optional · max 20MB">
          <Input id="file" name="file" type="file" className="py-2" />
        </Field>

        <FormError>{state.error}</FormError>
        <FormSuccess>{state.success}</FormSuccess>
        <SubmitButton resubmit={Boolean(submission)} />
      </form>
    </div>
  );
}
