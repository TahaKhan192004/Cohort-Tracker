"use client";

import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  createCohort,
  setActiveCohort,
  archiveCohort,
} from "@/app/actions/admin-content";
import type { ActionState } from "@/app/actions/auth";
import { Field, Input, FormError, FormSuccess } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create cohort"}
    </Button>
  );
}

export function CohortForm() {
  const router = useRouter();
  const [state, formAction] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await createCohort(prev, formData);
      if (result.success) router.refresh();
      return result;
    },
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Name" htmlFor="name">
        <Input
          id="name"
          name="name"
          placeholder="Beta Cohort — July 2026"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" htmlFor="start_date">
          <Input id="start_date" name="start_date" type="date" required />
        </Field>
        <Field label="End date" htmlFor="end_date">
          <Input id="end_date" name="end_date" type="date" required />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-espresso">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked
          className="accent-[#7A1F2B]"
        />
        Make this the active cohort
      </label>

      <FormError>{state.error}</FormError>
      <FormSuccess>{state.success}</FormSuccess>
      <SubmitButton />
    </form>
  );
}

export function CohortActions({
  cohortId,
  isActive,
}: {
  cohortId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1">
      {isActive ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => archiveCohort(cohortId))}
          className="rounded-[5px] px-2 py-1 text-xs text-smoke transition-colors hover:bg-muted-warm hover:text-espresso disabled:opacity-50"
        >
          Archive
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setActiveCohort(cohortId))}
          className="rounded-[5px] px-2 py-1 text-xs text-terracotta transition-colors hover:bg-muted-warm disabled:opacity-50"
        >
          Make active
        </button>
      )}
    </div>
  );
}
