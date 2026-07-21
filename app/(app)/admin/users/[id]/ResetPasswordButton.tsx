"use client";

import { useState } from "react";
import { resetParticipantPassword } from "@/app/actions/admin-users";
import { Button } from "@/components/ui/Button";

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [password, setPassword] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reset() {
    if (
      !confirm(
        "Generate a new password? Their current one stops working immediately.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await resetParticipantPassword(userId);
      if (result.error) setError(result.error);
      else setPassword(result.password ?? null);
    } finally {
      setBusy(false);
    }
  }

  if (password) {
    return (
      <div className="rounded-[7px] border border-sand bg-muted-warm/60 p-4">
        <p className="text-xs uppercase tracking-[0.1em] text-terracotta">
          New password
        </p>
        <p className="mt-1.5 font-mono text-sm text-espresso">{password}</p>
        <p className="mt-1.5 text-xs text-smoke">
          Copy it now — it isn&apos;t shown again.
        </p>
      </div>
    );
  }

  return (
    <div className="text-right">
      <Button variant="secondary" onClick={reset} disabled={busy}>
        {busy ? "Resetting…" : "Reset password"}
      </Button>
      {error ? <p className="mt-2 text-sm text-terracotta">{error}</p> : null}
    </div>
  );
}
