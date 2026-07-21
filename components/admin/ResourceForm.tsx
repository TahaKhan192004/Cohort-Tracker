"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createResource, updateResource } from "@/app/actions/admin-content";
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
import {
  RESOURCE_TYPE_LABELS,
  type Resource,
  type ResourceType,
} from "@/lib/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function ResourceForm({ resource }: { resource?: Resource }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    resource ? updateResource : createResource,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {resource ? <input type="hidden" name="id" value={resource.id} /> : null}

      <Field label="Title" htmlFor="title">
        <Input
          id="title"
          name="title"
          defaultValue={resource?.title ?? ""}
          required
        />
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          defaultValue={resource?.description ?? ""}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="resource_type">
          <Select
            id="resource_type"
            name="resource_type"
            defaultValue={resource?.resource_type ?? "recording"}
          >
            {(Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[]).map((t) => (
              <option key={t} value={t}>
                {RESOURCE_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Category" htmlFor="category" hint="e.g. Week 1, Live Calls">
          <Input
            id="category"
            name="category"
            defaultValue={resource?.category ?? ""}
          />
        </Field>
      </div>

      <Field
        label="Content URL"
        htmlFor="content_url"
        hint="Loom, YouTube, Vimeo, or a document link"
      >
        <Input
          id="content_url"
          name="content_url"
          type="url"
          defaultValue={resource?.content_url ?? ""}
          placeholder="https://…"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Thumbnail URL" htmlFor="thumbnail_url" hint="optional">
          <Input
            id="thumbnail_url"
            name="thumbnail_url"
            type="url"
            defaultValue={resource?.thumbnail_url ?? ""}
          />
        </Field>

        <Field label="Sort order" htmlFor="sort_order">
          <Input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={resource?.sort_order ?? 0}
          />
        </Field>
      </div>

      <FormError>{state.error}</FormError>
      <FormSuccess>{state.success}</FormSuccess>
      <SubmitButton label={resource ? "Save resource" : "Add resource"} />
    </form>
  );
}
