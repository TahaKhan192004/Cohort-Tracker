"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createParticipant,
  type CreateUserState,
} from "@/app/actions/admin-users";
import { Field, Input, FormError } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating…" : "Create account"}
    </Button>
  );
}

export function CreateUserForm() {
  const [state, formAction] = useActionState<CreateUserState, FormData>(
    createParticipant,
    {},
  );

  if (state.credentials) return <Credentials {...state.credentials} />;

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Full name" htmlFor="full_name">
        <Input id="full_name" name="full_name" required />
      </Field>

      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required />
      </Field>

      <Field
        label="Username"
        htmlFor="username"
        hint="what they'll type to log in"
      >
        <Input
          id="username"
          name="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </Field>

      <FormError>{state.error}</FormError>
      <SubmitButton />

      <p className="text-xs text-smoke">
        A 16-character password is generated automatically. You&apos;ll see it
        once on the next screen.
      </p>
    </form>
  );
}

function Credentials({
  full_name,
  username,
  email,
  password,
}: {
  full_name: string;
  username: string;
  email: string;
  password: string;
}) {
  const [copied, setCopied] = useState(false);

  const block = `Login: https://your-app-url/login\nUsername: ${username}\nPassword: ${password}`;

  async function copy() {
    await navigator.clipboard.writeText(block);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl">{full_name} is in</h2>
        <p className="mt-1.5 text-sm text-smoke">
          Copy these now — the password is not stored anywhere and this is the
          only time it&apos;s shown.
        </p>
      </div>

      <dl className="space-y-3 rounded-[7px] border border-sand bg-muted-warm/60 p-4 text-sm">
        <Row label="Email" value={email} />
        <Row label="Username" value={username} />
        <Row label="Password" value={password} mono />
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button onClick={copy} variant="secondary">
          {copied ? "Copied" : "Copy credentials"}
        </Button>
        <ButtonLink href="/admin/users/create">Add another</ButtonLink>
        <ButtonLink href="/admin/users" variant="ghost">
          Done
        </ButtonLink>
      </div>

      <p className="text-xs text-smoke">
        Need to change it later?{" "}
        <Link href="/admin/users" className="text-terracotta hover:underline">
          Reset from their profile
        </Link>
        .
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <dt className="text-smoke">{label}</dt>
      <dd className={mono ? "font-mono text-espresso" : "text-espresso"}>
        {value}
      </dd>
    </div>
  );
}
