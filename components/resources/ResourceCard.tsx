import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { ResourceTypeBadge } from "@/components/ui/Badge";
import {
  ClipboardListIcon,
  FilmIcon,
  WrenchIcon,
  MicIcon,
  FileTextIcon,
} from "@/components/ui/icons";
import type { Resource, ResourceType } from "@/lib/types";

const TYPE_ICONS: Record<ResourceType, ComponentType<SVGProps<SVGSVGElement>>> = {
  sop: ClipboardListIcon,
  video_tutorial: FilmIcon,
  skill: WrenchIcon,
  recording: MicIcon,
  document: FileTextIcon,
};

export function ResourceCard({ resource }: { resource: Resource }) {
  const TypeIcon = TYPE_ICONS[resource.resource_type];
  return (
    <Link
      href={`/resources/${resource.id}`}
      className="group flex flex-col overflow-hidden rounded-[7px] border border-sand bg-white/60 transition-colors hover:border-ring-accent"
    >
      <div className="flex aspect-video items-center justify-center overflow-hidden bg-muted-warm">
        {resource.thumbnail_url ? (
          // Thumbnails are arbitrary external URLs, so plain <img> avoids
          // having to allowlist every host in next.config.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resource.thumbnail_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <TypeIcon className="text-4xl text-smoke/50" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <ResourceTypeBadge type={resource.resource_type} />
          {resource.category ? (
            <span className="text-xs text-smoke">{resource.category}</span>
          ) : null}
        </div>

        <p className="font-display text-lg leading-snug text-umber">
          {resource.title}
        </p>

        {resource.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-smoke">
            {resource.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
