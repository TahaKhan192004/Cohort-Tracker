"use client";

import { useState, useTransition } from "react";
import { setAssignmentStatus } from "@/app/actions/tasks";
import { cn } from "@/lib/utils";
import type { AssignmentStatus } from "@/lib/types";

const OPTIONS: { value: AssignmentStatus; label: string }[] = [
  { value: "pending", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export function StatusToggle({
  assignmentId,
  status,
}: {
  assignmentId: string;
  status: AssignmentStatus;
}) {
  // Optimistic local state so the toggle responds before the round trip.
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(value: AssignmentStatus) {
    if (value === current) return;
    const previous = current;
    setCurrent(value);
    setError(null);

    startTransition(async () => {
      const result = await setAssignmentStatus(assignmentId, value);
      if (result?.error) {
        setCurrent(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div
        className={cn(
          "inline-flex flex-wrap gap-1 rounded-[7px] border border-sand p-1",
          pending && "opacity-70",
        )}
        role="group"
        aria-label="Task status"
      >
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => choose(option.value)}
            aria-pressed={current === option.value}
            className={cn(
              "rounded-[5px] px-3 py-1.5 text-sm transition-colors",
              current === option.value
                ? "bg-terracotta text-cream"
                : "text-smoke hover:bg-muted-warm hover:text-espresso",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-terracotta">{error}</p> : null}
    </div>
  );
}
