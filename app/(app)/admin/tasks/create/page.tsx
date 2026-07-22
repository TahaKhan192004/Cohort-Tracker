import Link from "next/link";
import { requireAdmin, getActiveCohort } from "@/lib/auth";
import { getCohortResourceOptions } from "@/lib/queries";
import { Card, Eyebrow } from "@/components/ui/Card";
import { TaskForm } from "@/components/admin/TaskForm";

export const metadata = { title: "New task — Admin" };

export default async function CreateTaskPage() {
  await requireAdmin();
  const cohort = await getActiveCohort();
  const resources = cohort ? await getCohortResourceOptions(cohort.id) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href="/admin/tasks" className="text-sm text-smoke hover:text-terracotta">
          ← Tasks
        </Link>
      </div>

      <header>
        <Eyebrow>{cohort?.name ?? "No active cohort"}</Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">
          New <span className="italic-verb">task</span>
        </h1>
      </header>

      <Card>
        <TaskForm resources={resources} />
      </Card>
    </div>
  );
}
