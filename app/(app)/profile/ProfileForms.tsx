"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateProfile,
  changePassword,
  type ActionState,
} from "@/app/actions/auth";
import { Field, Input, FormError, FormSuccess } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { AppUser } from "@/lib/types";

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

export function ProfileForm({ user }: { user: AppUser }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <Field label="Full name" htmlFor="full_name">
        <Input
          id="full_name"
          name="full_name"
          defaultValue={user.full_name}
          required
        />
      </Field>

      <FormError>{state.error}</FormError>
      <FormSuccess>{state.success}</FormSuccess>
      <SubmitButton idle="Save changes" busy="Saving…" />
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    changePassword,
    {},
  );

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <Field label="New password" htmlFor="password" hint="at least 10 characters">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      <Field label="Confirm new password" htmlFor="confirm_password">
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      <FormError>{state.error}</FormError>
      <FormSuccess>{state.success}</FormSuccess>
      <SubmitButton idle="Update password" busy="Updating…" />
    </form>
  );
}
