import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[7px] border border-sand bg-white/60 p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
  description,
}: {
  title: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-smoke">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** Eyebrow label — small caps terracotta, one of its sanctioned uses. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.14em] text-terracotta">
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[7px] border border-dashed border-sand px-6 py-14 text-center">
      <p className="font-display text-lg text-umber">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm text-smoke">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
