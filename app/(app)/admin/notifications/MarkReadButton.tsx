"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markCommentsRead } from "@/app/actions/admin-review";

export function MarkReadButton({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markCommentsRead(assignmentId);
          router.refresh();
        })
      }
      className="text-xs text-smoke transition-colors hover:text-espresso disabled:opacity-50"
    >
      {pending ? "Marking…" : "Mark read"}
    </button>
  );
}
