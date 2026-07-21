import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { ResourceTypeBadge, RESOURCE_TYPE_STYLES } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
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
  const style = RESOURCE_TYPE_STYLES[resource.resource_type];
  return (
    <Link
      href={`/resources/${resource.id}`}
      className={cn(
        // Hover recolours only three sides — the left edge stays the type colour.
        "group flex flex-col overflow-hidden rounded-[7px] border border-sand border-l-[3px] bg-white/60 transition-colors hover:border-t-ring-accent hover:border-r-ring-accent hover:border-b-ring-accent",
        style.border,
      )}
    >
      <div
        className={cn(
          "flex aspect-video items-center justify-center overflow-hidden",
          resource.thumbnail_url ? "bg-muted-warm" : style.tint,
        )}
      >
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
          <TypeIcon className={cn("text-4xl", style.icon)} />
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
