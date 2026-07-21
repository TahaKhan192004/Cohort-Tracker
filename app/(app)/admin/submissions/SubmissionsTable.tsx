"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  reviewSubmission,
  getSubmissionFileUrl,
} from "@/app/actions/admin-review";
import { TableWrap, Th, Td, Tr } from "@/components/ui/Table";
import { SubmissionStatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea, FormError } from "@/components/ui/Field";
import { formatDateTime } from "@/lib/utils";
import type { Submission } from "@/lib/types";

export interface SubmissionRow extends Submission {
  user: { id: string; full_name: string } | null;
  task: { id: string; title: string } | null;
}

export function SubmissionsTable({ rows }: { rows: SubmissionRow[] }) {
  const [open, setOpen] = useState<SubmissionRow | null>(null);

  return (
    <>
      <TableWrap>
        <thead>
          <tr>
            <Th>Participant</Th>
            <Th>Task</Th>
            <Th>Submitted</Th>
            <Th>Status</Th>
            <Th className="w-24" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Tr key={row.id}>
              <Td>
                {row.user ? (
                  <Link
                    href={`/admin/users/${row.user.id}`}
                    className="text-espresso hover:text-terracotta"
                  >
                    {row.user.full_name}
                  </Link>
                ) : (
                  "—"
                )}
              </Td>
              <Td className="text-smoke">{row.task?.title ?? "—"}</Td>
              <Td className="text-smoke">{formatDateTime(row.submitted_at)}</Td>
              <Td>
                <SubmissionStatusBadge status={row.status} />
              </Td>
              <Td>
                <button
                  type="button"
                  onClick={() => setOpen(row)}
                  className="rounded-[5px] px-2 py-1 text-xs text-terracotta transition-colors hover:bg-muted-warm"
                >
                  Review
                </button>
              </Td>
            </Tr>
          ))}
        </tbody>
      </TableWrap>

      <ReviewModal submission={open} onClose={() => setOpen(null)} />
    </>
  );
}

function ReviewModal({
  submission,
  onClose,
}: {
  submission: SubmissionRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(status: "reviewed" | "needs_revision") {
    if (!submission) return;
    setError(null);
    startTransition(async () => {
      const result = await reviewSubmission(submission.id, status, feedback);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setFeedback("");
      onClose();
      router.refresh();
    });
  }

  async function openFile(path: string) {
    const result = await getSubmissionFileUrl(path);
    if (result.url) window.open(result.url, "_blank", "noopener");
    else setError(result.error ?? "Could not open that file.");
  }

  return (
    <Modal
      open={Boolean(submission)}
      onClose={onClose}
      title={submission?.task?.title ?? "Review submission"}
    >
      {submission ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-smoke">
              {submission.user?.full_name ?? "Unknown"} ·{" "}
              {formatDateTime(submission.submitted_at)}
            </p>
            <SubmissionStatusBadge status={submission.status} />
          </div>

          {submission.submission_text ? (
            <div className="rounded-[7px] border border-sand bg-white/60 p-4">
              <p className="whitespace-pre-wrap text-sm text-espresso">
                {submission.submission_text}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {submission.link_url ? (
              <a
                href={submission.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[7px] border border-sand px-3 py-1.5 text-sm text-espresso transition-colors hover:bg-muted-warm"
              >
                Open link ↗
              </a>
            ) : null}
            {submission.file_url ? (
              <button
                type="button"
                onClick={() => openFile(submission.file_url!)}
                className="rounded-[7px] border border-sand px-3 py-1.5 text-sm text-espresso transition-colors hover:bg-muted-warm"
              >
                Open file ↗
              </button>
            ) : null}
          </div>

          {submission.admin_feedback ? (
            <div className="rounded-[7px] border border-sand bg-muted-warm/60 p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-terracotta">
                Previous feedback
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-espresso">
                {submission.admin_feedback}
              </p>
            </div>
          ) : null}

          <div>
            <label
              htmlFor="feedback"
              className="mb-1.5 block text-sm text-espresso"
            >
              Feedback
            </label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What worked, what to change."
            />
          </div>

          <FormError>{error}</FormError>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => decide("reviewed")} disabled={pending}>
              {pending ? "Saving…" : "Mark reviewed"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => decide("needs_revision")}
              disabled={pending}
            >
              Request revision
            </Button>
          </div>
          <p className="text-xs text-smoke">
            Either choice notifies the participant.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
