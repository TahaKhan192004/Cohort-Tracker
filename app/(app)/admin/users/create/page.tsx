import Link from "next/link";
import { requireAdmin, getActiveCohort } from "@/lib/auth";
import { Card, Eyebrow } from "@/components/ui/Card";
import { CreateUserForm } from "./CreateUserForm";

export const metadata = { title: "Add participant — Admin" };

export default async function CreateUserPage() {
  await requireAdmin();
  const cohort = await getActiveCohort();

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link
          href="/admin/users"
          className="text-sm text-smoke hover:text-terracotta"
        >
          ← Participants
        </Link>
      </div>

      <header>
        <Eyebrow>New account</Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">
          Add a <span className="italic-verb">participant</span>
        </h1>
        <p className="mt-2 text-sm text-smoke">
          {cohort
            ? `They'll join ${cohort.name} and pick up every task already in it.`
            : "No active cohort — create one first so they get assigned tasks."}
        </p>
      </header>

      <Card>
        <CreateUserForm />
      </Card>
    </div>
  );
}
