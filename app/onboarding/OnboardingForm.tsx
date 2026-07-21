"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { completeOnboarding, type ActionState } from "@/app/actions/auth";
import { FormError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Setting up…" : "Start the cohort"}
    </Button>
  );
}

export function OnboardingForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    completeOnboarding,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormError>{state.error}</FormError>
      <SubmitButton />
    </form>
  );
}
