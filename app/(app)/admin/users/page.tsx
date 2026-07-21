import Link from "next/link";
import { requireAdmin, getActiveCohort } from "@/lib/auth";
import { getCohortProgress } from "@/lib/queries";
import { Card, Eyebrow, EmptyState } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Progress";
import { TableWrap, Th, Td, Tr } from "@/components/ui/Table";
import { relativeTime } from "@/lib/utils";
import { ExportButton } from "./ExportButton";

export const metadata = { title: "Participants — Admin" };

export default async function AdminUsersPage() {
  await requireAdmin();
  const cohort = await getActiveCohort();
  const progress = cohort ? await getCohortProgress(cohort.id) : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{cohort?.name ?? "No active cohort"}</Eyebrow>
          <h1 className="mt-3 text-3xl leading-tight">Participants</h1>
          <p className="mt-2 text-sm text-smoke">
            {progress.length} {progress.length === 1 ? "person" : "people"} in this cohort
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton />
          <ButtonLink href="/admin/users/create">Add participant</ButtonLink>
        </div>
      </header>

      <Card className="p-0">
        {progress.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No participants yet"
              description="Create an account and send the credentials over however you like."
              action={
                <ButtonLink href="/admin/users/create" size="sm">
                  Add participant
                </ButtonLink>
              }
            />
          </div>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th className="w-48">Progress</Th>
                <Th>Overdue</Th>
                <Th>Last active</Th>
              </tr>
            </thead>
            <tbody>
              {progress.map((row) => (
                <Tr key={row.user.id}>
                  <Td>
                    <Link
                      href={`/admin/users/${row.user.id}`}
                      className="text-espresso hover:text-terracotta"
                    >
                      {row.user.full_name}
                    </Link>
                    <p className="text-xs text-smoke">@{row.user.username}</p>
                  </Td>
                  <Td className="text-smoke">{row.user.email}</Td>
                  <Td>
                    <ProgressBar value={row.percent} showLabel />
                    <p className="mt-1 text-xs text-smoke">
                      {row.completed}/{row.total}
                    </p>
                  </Td>
                  <Td>
                    <span
                      className={row.overdue > 0 ? "text-terracotta" : "text-smoke"}
                    >
                      {row.overdue}
                    </span>
                  </Td>
                  <Td className="text-smoke">
                    {row.user.last_active_at
                      ? relativeTime(row.user.last_active_at)
                      : "Never"}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
