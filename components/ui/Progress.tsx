import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  showLabel = false,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
}) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-terracotta transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <span className="w-10 text-right text-xs tabular-nums text-smoke">
          {pct}%
        </span>
      ) : null}
    </div>
  );
}

/** Circular progress for the participant dashboard hero. */
export function ProgressRing({
  value,
  size = 132,
}: {
  value: number;
  size?: number;
}) {
  const pct = Math.min(Math.max(value, 0), 100);
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--sand)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--terracotta)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl text-umber tabular-nums">
          {pct}%
        </span>
        <span className="text-xs text-smoke">complete</span>
      </div>
    </div>
  );
}
