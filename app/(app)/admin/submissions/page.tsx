import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Eyebrow, EmptyState } from "@/components/ui/Card";
import { SubmissionsTable, type SubmissionRow } from "./SubmissionsTable";
import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/lib/types";

export const metadata = { title: "Submissions — Admin" };

const FILTERS: { key: string; label: string; match?: SubmissionStatus }[] = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Awaiting review", match: "submitted" },
  { key: "needs_revision", label: "Needs revision", match: "needs_revision" },
  { key: "reviewed", label: "Reviewed", match: "reviewed" },
];

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const active = FILTERS.find((f) => f.key === status) ?? FILTERS[0];

  const supabase = await createClient();
  let query = supabase
    .from("submissions")
    .select("*, user:users(id, full_name), task:tasks(id, title)")
    .order("submitted_at", { ascending: false });

  if (active.match) query = query.eq("status", active.match);

  const { data } = await query;
  const rows = (data ?? []) as unknown as SubmissionRow[];

  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Review queue</Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">Submissions</h1>
        <p className="mt-2 text-sm text-smoke">
          {rows.length} {rows.length === 1 ? "submission" : "submissions"}
          {active.match ? ` · ${active.label.toLowerCase()}` : ""}
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={
              f.key === "all"
                ? "/admin/submissions"
                : `/admin/submissions?status=${f.key}`
            }
            className={cn(
              "rounded-[7px] border px-3.5 py-1.5 text-sm transition-colors",
              active.key === f.key
                ? "border-terracotta bg-terracotta text-cream"
                : "border-sand text-smoke hover:bg-muted-warm hover:text-espresso",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <Card className="p-0">
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Nothing here"
              description="Submissions land here as participants send work in."
            />
          </div>
        ) : (
          <SubmissionsTable rows={rows} />
        )}
      </Card>
    </div>
  );
}
