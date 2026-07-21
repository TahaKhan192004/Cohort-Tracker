import Link from "next/link";
import { requireAdmin, getActiveCohort } from "@/lib/auth";
import { Card, Eyebrow } from "@/components/ui/Card";
import { ResourceForm } from "@/components/admin/ResourceForm";

export const metadata = { title: "Add resource — Admin" };

export default async function CreateResourcePage() {
  await requireAdmin();
  const cohort = await getActiveCohort();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/admin/resources"
          className="text-sm text-smoke hover:text-terracotta"
        >
          ← Resources
        </Link>
      </div>

      <header>
        <Eyebrow>{cohort?.name ?? "No active cohort"}</Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">
          Add a <span className="italic-verb">resource</span>
        </h1>
        <p className="mt-2 text-sm text-smoke">
          Loom, YouTube, and Vimeo links embed automatically. Anything else
          becomes a link out.
        </p>
      </header>

      <Card>
        <ResourceForm />
      </Card>
    </div>
  );
}
