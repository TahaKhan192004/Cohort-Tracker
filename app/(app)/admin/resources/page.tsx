import { requireAdmin, getActiveCohort } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Eyebrow, EmptyState } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { ResourceList } from "./ResourceList";
import type { Resource } from "@/lib/types";

export const metadata = { title: "Resources — Admin" };

export default async function AdminResourcesPage() {
  await requireAdmin();
  const cohort = await getActiveCohort();

  if (!cohort) {
    return (
      <div className="space-y-8">
        <header>
          <Eyebrow>Admin</Eyebrow>
          <h1 className="mt-3 text-3xl leading-tight">Resources</h1>
        </header>
        <EmptyState
          title="No active cohort"
          description="Resources belong to a cohort, so create one first."
          action={<ButtonLink href="/admin/cohorts">Create a cohort</ButtonLink>}
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("cohort_id", cohort.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const resources = (data ?? []) as Resource[];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{cohort.name}</Eyebrow>
          <h1 className="mt-3 text-3xl leading-tight">Resources</h1>
          <p className="mt-2 text-sm text-smoke">
            {resources.length} {resources.length === 1 ? "item" : "items"} in the
            library
          </p>
        </div>
        <ButtonLink href="/admin/resources/create">Add resource</ButtonLink>
      </header>

      {resources.length === 0 ? (
        <Card>
          <EmptyState
            title="Library is empty"
            description="Add call recordings, SOPs, tutorials, and skill walkthroughs."
            action={
              <ButtonLink href="/admin/resources/create" size="sm">
                Add the first one
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <ResourceList resources={resources} />
      )}
    </div>
  );
}
