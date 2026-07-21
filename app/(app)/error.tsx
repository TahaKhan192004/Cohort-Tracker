"use client";

import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-xs uppercase tracking-[0.14em] text-terracotta">
        Something broke
      </p>
      <h1 className="mt-3 text-2xl">That didn&apos;t load</h1>
      <p className="mt-2.5 text-sm text-smoke">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
