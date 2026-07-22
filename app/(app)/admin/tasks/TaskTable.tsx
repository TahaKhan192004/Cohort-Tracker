"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import {
  deleteTask,
  deleteTasks,
  duplicateTask,
  setTaskVisibility,
} from "@/app/actions/admin-tasks";
import { TableWrap, Th, Td, Tr } from "@/components/ui/Table";
import { TaskTypeBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { formatDateTime, percent, urgency } from "@/lib/utils";
import type { Task } from "@/lib/types";

export interface AdminTaskRow {
  task: Task;
  completed: number;
  overdue: number;
  assigned: number;
}

export function TaskTable({ rows }: { rows: AdminTaskRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const allSelected = rows.length > 0 && selected.size === rows.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.task.id)));
  }

  function removeSelected() {
    const count = selected.size;
    if (
      !confirm(
        `Delete ${count} ${count === 1 ? "task" : "tasks"}? Their assignments, comments, and submissions go too.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      await deleteTasks([...selected]);
      setSelected(new Set());
    });
  }

  return (
    <div>
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand bg-muted-warm/60 px-4 py-3">
          <p className="text-sm text-espresso">
            {selected.size} selected
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={removeSelected}
              disabled={pending}
            >
              Delete selected
            </Button>
          </div>
        </div>
      ) : null}

      <TableWrap>
        <thead>
          <tr>
            <Th className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all tasks"
                className="accent-[#7A1F2B]"
              />
            </Th>
            <Th>Title</Th>
            <Th>Week / Day</Th>
            <Th>Deadline</Th>
            <Th>Type</Th>
            <Th className="w-28">Visible</Th>
            <Th className="w-44">Completion</Th>
            <Th className="w-32" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ task, completed, overdue, assigned }) => (
            <Tr key={task.id}>
              <Td>
                <input
                  type="checkbox"
                  checked={selected.has(task.id)}
                  onChange={() => toggle(task.id)}
                  aria-label={`Select ${task.title}`}
                  className="accent-[#7A1F2B]"
                />
              </Td>
              <Td>
                <Link
                  href={`/admin/tasks/${task.id}`}
                  className={
                    task.is_published
                      ? "text-espresso hover:text-terracotta"
                      : "text-smoke italic hover:text-terracotta"
                  }
                >
                  {task.title}
                </Link>
              </Td>
              <Td className="text-smoke">
                {task.week_number ? `W${task.week_number}` : "—"}
                {task.day_number ? ` · D${task.day_number}` : ""}
              </Td>
              <Td
                className={
                  urgency(task.deadline) === "late" ? "text-terracotta" : "text-smoke"
                }
              >
                {formatDateTime(task.deadline)}
              </Td>
              <Td>
                <TaskTypeBadge type={task.task_type} />
              </Td>
              <Td>
                <VisibilityToggle task={task} />
              </Td>
              <Td>
                <ProgressBar value={percent(completed, assigned)} />
                <p className="mt-1 text-xs text-smoke">
                  {completed}/{assigned} done
                  {overdue > 0 ? (
                    <span className="text-terracotta"> · {overdue} overdue</span>
                  ) : null}
                </p>
              </Td>
              <Td>
                <RowActions taskId={task.id} title={task.title} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}

function VisibilityToggle({ task }: { task: Task }) {
  const [pending, startTransition] = useTransition();
  // The switch moves immediately, then snaps back to whatever the server
  // reports once the action revalidates — including on failure.
  const [published, setPublished] = useOptimistic(task.is_published);

  return (
    <div className="flex items-center gap-2">
      <Toggle
        checked={published}
        disabled={pending}
        label={`${published ? "Hide" : "Show"} ${task.title} for participants`}
        onChange={(next) => {
          startTransition(async () => {
            setPublished(next);
            const result = await setTaskVisibility(task.id, next);
            if (result?.error) alert(`Could not update visibility: ${result.error}`);
          });
        }}
      />
      <span className={published ? "text-xs text-smoke" : "text-xs text-terracotta"}>
        {published ? "Live" : "Hidden"}
      </span>
    </div>
  );
}

function RowActions({ taskId, title }: { taskId: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/admin/tasks/${taskId}`}
        className="rounded-[5px] px-2 py-1 text-xs text-smoke transition-colors hover:bg-muted-warm hover:text-espresso"
      >
        Edit
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void duplicateTask(taskId))}
        className="rounded-[5px] px-2 py-1 text-xs text-smoke transition-colors hover:bg-muted-warm hover:text-espresso disabled:opacity-50"
      >
        Duplicate
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
          startTransition(() => void deleteTask(taskId));
        }}
        className="rounded-[5px] px-2 py-1 text-xs text-terracotta transition-colors hover:bg-muted-warm disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
