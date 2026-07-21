import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Eyebrow, EmptyState } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TableWrap, Th, Td, Tr } from "@/components/ui/Table";
import { CohortForm, CohortActions } from "./CohortForms";
import { formatDate } from "@/lib/utils";
import type { Cohort } from "@/lib/types";

export const metadata = { title: "Cohorts — Admin" };

export default async function AdminCohortsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("cohorts")
    .select("*")
    .order("start_date", { ascending: false });

  const cohorts = (data ?? []) as Cohort[];

  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Admin</Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">Cohorts</h1>
        <p className="mt-2 text-sm text-smoke">
          One cohort is active at a time. New participants, tasks, and resources
          attach to whichever that is.
        </p>
      </header>

      <Card className="p-0">
        {cohorts.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No cohorts yet"
              description="Create one below to get started."
            />
          </div>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Starts</Th>
                <Th>Ends</Th>
                <Th>State</Th>
                <Th className="w-40" />
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => (
                <Tr key={cohort.id}>
                  <Td>{cohort.name}</Td>
                  <Td className="text-smoke">{formatDate(cohort.start_date)}</Td>
                  <Td className="text-smoke">{formatDate(cohort.end_date)}</Td>
                  <Td>
                    {cohort.is_active ? (
                      <Badge tone="good">Active</Badge>
                    ) : (
                      <Badge>Archived</Badge>
                    )}
                  </Td>
                  <Td>
                    <CohortActions
                      cohortId={cohort.id}
                      isActive={cohort.is_active}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Card className="max-w-lg">
        <CardHeader title="New cohort" />
        <CohortForm />
      </Card>
    </div>
  );
}
