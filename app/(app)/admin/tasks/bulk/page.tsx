import Link from "next/link";
import { requireAdmin, getActiveCohort } from "@/lib/auth";
import { Card, Eyebrow } from "@/components/ui/Card";
import { BulkTaskUploader } from "@/components/admin/BulkTaskUploader";

export const metadata = { title: "Bulk add tasks — Admin" };

export default async function BulkTasksPage() {
  await requireAdmin();
  const cohort = await getActiveCohort();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/tasks" className="text-sm text-smoke hover:text-terracotta">
          ← Tasks
        </Link>
      </div>

      <header>
        <Eyebrow>{cohort?.name ?? "No active cohort"}</Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">
          Bulk <span className="italic-verb">add</span>
        </h1>
        <p className="mt-2 text-sm text-smoke">
          Paste a whole schedule at once. Everything you create gets assigned to
          every participant in the cohort.
        </p>
      </header>

      <Card>
        <BulkTaskUploader />
      </Card>
    </div>
  );
}
