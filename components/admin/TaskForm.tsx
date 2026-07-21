"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTask, updateTask } from "@/app/actions/admin-tasks";
import type { ActionState } from "@/app/actions/auth";
import {
  Field,
  Input,
  Textarea,
  Select,
  FormError,
  FormSuccess,
} from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { TASK_TYPE_LABELS, type Task, type TaskType } from "@/lib/types";

/** datetime-local wants "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInputValue(iso: string | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function TaskForm({ task }: { task?: Task }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    task ? updateTask : createTask,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {task ? <input type="hidden" name="id" value={task.id} /> : null}

      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" defaultValue={task?.title ?? ""} required />
      </Field>

      <Field label="Description" htmlFor="description" hint="markdown supported">
        <Textarea
          id="description"
          name="description"
          defaultValue={task?.description ?? ""}
          className="min-h-40"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Week" htmlFor="week_number">
          <Input
            id="week_number"
            name="week_number"
            type="number"
            min={1}
            max={12}
            defaultValue={task?.week_number ?? ""}
          />
        </Field>

        <Field label="Day" htmlFor="day_number">
          <Input
            id="day_number"
            name="day_number"
            type="number"
            min={1}
            max={90}
            defaultValue={task?.day_number ?? ""}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Deadline" htmlFor="deadline">
          <Input
            id="deadline"
            name="deadline"
            type="datetime-local"
            defaultValue={toLocalInputValue(task?.deadline)}
            required
          />
        </Field>

        <Field label="Type" htmlFor="task_type">
          <Select
            id="task_type"
            name="task_type"
            defaultValue={task?.task_type ?? "action"}
          >
            {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((t) => (
              <option key={t} value={t}>
                {TASK_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Skill name" htmlFor="skill_name" hint="optional">
          <Input
            id="skill_name"
            name="skill_name"
            defaultValue={task?.skill_name ?? ""}
          />
        </Field>

        <Field label="Sort order" htmlFor="sort_order">
          <Input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={task?.sort_order ?? 0}
          />
        </Field>
      </div>

      <FormError>{state.error}</FormError>
      <FormSuccess>{state.success}</FormSuccess>
      <SubmitButton label={task ? "Save task" : "Create and assign"} />

      {!task ? (
        <p className="text-xs text-smoke">
          Creating a task assigns it to everyone in the active cohort.
        </p>
      ) : null}
    </form>
  );
}
