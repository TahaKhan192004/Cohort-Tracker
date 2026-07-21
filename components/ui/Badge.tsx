import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  STATUS_LABELS,
  TASK_TYPE_LABELS,
  RESOURCE_TYPE_LABELS,
  type DisplayStatus,
  type ResourceType,
  type SubmissionStatus,
  type TaskType,
} from "@/lib/types";

const TONES = {
  neutral: "border-sand bg-muted-warm text-smoke",
  accent: "border-ring-accent/50 bg-ring-accent/15 text-espresso",
  // Warm green — the palette bans cool greys, not the on-track signal.
  good: "border-[#5C7A52]/40 bg-[#5C7A52]/12 text-[#3F5738]",
  warn: "border-[#B07A2E]/40 bg-[#B07A2E]/12 text-[#8A5D1E]",
  late: "border-terracotta/40 bg-terracotta/10 text-terracotta",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[5px] border px-2 py-0.5 text-xs whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONES: Record<DisplayStatus, Tone> = {
  pending: "neutral",
  in_progress: "accent",
  completed: "good",
  overdue: "late",
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function TaskTypeBadge({ type }: { type: TaskType }) {
  return <Badge tone="neutral">{TASK_TYPE_LABELS[type]}</Badge>;
}

export function ResourceTypeBadge({ type }: { type: ResourceType }) {
  return <Badge tone="accent">{RESOURCE_TYPE_LABELS[type]}</Badge>;
}

const SUBMISSION_TONES: Record<SubmissionStatus, Tone> = {
  submitted: "accent",
  reviewed: "good",
  needs_revision: "warn",
};

const SUBMISSION_LABELS: Record<SubmissionStatus, string> = {
  submitted: "Awaiting review",
  reviewed: "Reviewed",
  needs_revision: "Needs revision",
};

export function SubmissionStatusBadge({
  status,
}: {
  status: SubmissionStatus;
}) {
  return (
    <Badge tone={SUBMISSION_TONES[status]}>{SUBMISSION_LABELS[status]}</Badge>
  );
}
