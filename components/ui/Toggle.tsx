"use client";

import { cn } from "@/lib/utils";

/**
 * `role="switch"` rather than a styled checkbox — screen readers announce
 * on/off, and the control is driven by a server action, not form submission.
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50",
        checked
          ? "border-terracotta bg-terracotta"
          : "border-sand bg-muted-warm hover:bg-sand",
      )}
    >
      <span
        className={cn(
          "block h-3.5 w-3.5 rounded-full bg-cream shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}
