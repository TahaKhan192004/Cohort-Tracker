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

// Each resource type carries its own warm hue, so a Skill is distinguishable
// from an SOP or a recording at a glance. Written out in full (not composed)
// because Tailwind only sees class names that appear literally in the source.
export const RESOURCE_TYPE_STYLES: Record<
  ResourceType,
  { badge: string; border: string; tint: string; icon: string }
> = {
  recording: {
    badge: "border-res-recording/40 bg-res-recording/12 text-res-recording",
    border: "border-l-res-recording",
    tint: "bg-res-recording/8",
    icon: "text-res-recording/45",
  },
  video_tutorial: {
    badge: "border-res-video/40 bg-res-video/12 text-res-video",
    border: "border-l-res-video",
    tint: "bg-res-video/8",
    icon: "text-res-video/45",
  },
  sop: {
    badge: "border-res-sop/40 bg-res-sop/12 text-res-sop",
    border: "border-l-res-sop",
    tint: "bg-res-sop/8",
    icon: "text-res-sop/45",
  },
  skill: {
    badge: "border-res-skill/40 bg-res-skill/12 text-res-skill",
    border: "border-l-res-skill",
    tint: "bg-res-skill/8",
    icon: "text-res-skill/45",
  },
  document: {
    badge: "border-res-document/40 bg-res-document/12 text-res-document",
    border: "border-l-res-document",
    tint: "bg-res-document/8",
    icon: "text-res-document/45",
  },
};

export function ResourceTypeBadge({ type }: { type: ResourceType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[5px] border px-2 py-0.5 text-xs whitespace-nowrap",
        RESOURCE_TYPE_STYLES[type].badge,
      )}
    >
      {RESOURCE_TYPE_LABELS[type]}
    </span>
  );
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
