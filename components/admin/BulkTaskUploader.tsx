"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  parseBulkTasks,
  createBulkTasks,
  type ParsedTaskRow,
} from "@/app/actions/admin-tasks";
import { Textarea, FormError, FormSuccess } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { TableWrap, Th, Td, Tr } from "@/components/ui/Table";
import { TaskTypeBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

const SAMPLE = `title,description,week,day,deadline,type
Set up your Claude project,Create a project and add your business context,1,1,2026-08-03 17:00,action
Record your first SOP,Walk through one repeatable process end to end,1,2,2026-08-04 17:00,submission`;

export function BulkTaskUploader() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<ParsedTaskRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const validCount = rows?.filter((r) => !r.error).length ?? 0;
  const invalidCount = (rows?.length ?? 0) - validCount;

  function preview() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const parsed = await parseBulkTasks(raw);
      if (parsed.length === 0) {
        setError("Nothing to parse — paste some rows first.");
        setRows(null);
        return;
      }
      setRows(parsed);
    });
  }

  function confirm() {
    if (!rows) return;
    startTransition(async () => {
      const result = await createBulkTasks(rows);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(
        `Created ${result.created} ${result.created === 1 ? "task" : "tasks"} and assigned them to the cohort.`,
      );
      setRows(null);
      setRaw("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-espresso">
          One task per line: <code className="text-xs">title, description, week, day, deadline, type</code>
        </p>
        <p className="mb-3 text-xs text-smoke">
          Comma or tab separated. A header row is optional. Deadlines are read
          as US Eastern (ET). Types: action, submission, watch, skill_build.
        </p>
        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={SAMPLE}
          className="min-h-56 font-mono text-xs"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={preview} disabled={pending || !raw.trim()}>
          {pending && !rows ? "Parsing…" : "Preview"}
        </Button>
        {raw ? (
          <Button
            variant="ghost"
            onClick={() => {
              setRaw("");
              setRows(null);
              setError(null);
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>

      <FormError>{error}</FormError>
      <FormSuccess>{success}</FormSuccess>

      {rows ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-lg">Preview</h3>
            <p className="text-sm text-smoke">
              {validCount} ready
              {invalidCount > 0 ? (
                <span className="text-terracotta">
                  {" "}
                  · {invalidCount} will be skipped
                </span>
              ) : null}
            </p>
          </div>

          <TableWrap>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Week / Day</Th>
                <Th>Deadline</Th>
                <Th>Type</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <Tr key={i} className={row.error ? "bg-terracotta/5" : undefined}>
                  <Td>{row.title || <span className="text-smoke">—</span>}</Td>
                  <Td className="text-smoke">
                    {row.week_number ? `W${row.week_number}` : "—"}
                    {row.day_number ? ` · D${row.day_number}` : ""}
                  </Td>
                  <Td className="text-smoke">
                    {row.error === "Unreadable deadline"
                      ? row.deadline
                      : formatDateTime(row.deadline)}
                  </Td>
                  <Td>
                    <TaskTypeBadge type={row.task_type} />
                  </Td>
                  <Td>
                    {row.error ? (
                      <span className="text-xs text-terracotta">{row.error}</span>
                    ) : (
                      <span className="text-xs text-[#3F5738]">Ready</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>

          <Button onClick={confirm} disabled={pending || validCount === 0}>
            {pending
              ? "Creating…"
              : `Create ${validCount} ${validCount === 1 ? "task" : "tasks"}`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
