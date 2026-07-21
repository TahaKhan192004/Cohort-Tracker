"use client";

import { useState } from "react";
import { exportProgressCsv } from "@/app/actions/admin-users";
import { Button } from "@/components/ui/Button";

export function ExportButton() {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const result = await exportProgressCsv();
      if (!result.csv) {
        alert(result.error ?? "Nothing to export.");
        return;
      }
      // Build the file client-side so it never needs a public URL.
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename ?? "progress.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" onClick={download} disabled={busy}>
      {busy ? "Preparing…" : "Export CSV"}
    </Button>
  );
}
