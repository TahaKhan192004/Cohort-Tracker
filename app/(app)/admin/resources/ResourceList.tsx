"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteResource, moveResource } from "@/app/actions/admin-content";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { ResourceTypeBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { Resource } from "@/lib/types";

export function ResourceList({ resources }: { resources: Resource[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Resource | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <>
      <ul className="space-y-2">
        {resources.map((resource, index) => (
          <li
            key={resource.id}
            className="flex flex-wrap items-center gap-4 rounded-[7px] border border-sand bg-white/60 p-4"
          >
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                aria-label="Move up"
                disabled={pending || index === 0}
                onClick={() => run(() => moveResource(resource.id, "up"))}
                className="rounded-[4px] px-1.5 text-xs text-smoke transition-colors hover:bg-muted-warm hover:text-espresso disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={pending || index === resources.length - 1}
                onClick={() => run(() => moveResource(resource.id, "down"))}
                className="rounded-[4px] px-1.5 text-xs text-smoke transition-colors hover:bg-muted-warm hover:text-espresso disabled:opacity-30"
              >
                ▼
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-espresso">{resource.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <ResourceTypeBadge type={resource.resource_type} />
                {resource.category ? (
                  <span className="text-xs text-smoke">{resource.category}</span>
                ) : null}
                {resource.content_url ? (
                  <a
                    href={resource.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-smoke hover:text-terracotta"
                  >
                    Open ↗
                  </a>
                ) : null}
              </div>
            </div>

            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setEditing(resource)}
                className="rounded-[5px] px-2 py-1 text-xs text-smoke transition-colors hover:bg-muted-warm hover:text-espresso"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Delete "${resource.title}"?`)) return;
                  run(() => deleteResource(resource.id));
                }}
                className="rounded-[5px] px-2 py-1 text-xs text-terracotta transition-colors hover:bg-muted-warm disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(editing)}
        onClose={() => {
          setEditing(null);
          router.refresh();
        }}
        title="Edit resource"
      >
        {editing ? <ResourceForm resource={editing} /> : null}
      </Modal>
    </>
  );
}
