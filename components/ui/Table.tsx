import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Tables scroll inside their own container so the page never scrolls sideways. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[7px] border border-sand">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-sand bg-muted-warm px-4 py-3 text-left text-xs font-normal uppercase tracking-[0.1em] text-smoke",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("border-b border-sand/70 px-4 py-3 align-middle", className)}>
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("transition-colors hover:bg-muted-warm/50", className)}>
      {children}
    </tr>
  );
}
