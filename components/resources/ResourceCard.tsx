"use client";

import Link from "next/link";
import { useState, type ComponentType, type SVGProps } from "react";
import { ResourceTypeBadge, RESOURCE_TYPE_STYLES } from "@/components/ui/Badge";
import { VideoModal } from "./VideoModal";
import {
  ClipboardListIcon,
  FilmIcon,
  WrenchIcon,
  MicIcon,
  FileTextIcon,
  PlayIcon,
} from "@/components/ui/icons";
import { cn, toEmbedUrl } from "@/lib/utils";
import type { Resource, ResourceType } from "@/lib/types";

const TYPE_ICONS: Record<ResourceType, ComponentType<SVGProps<SVGSVGElement>>> = {
  sop: ClipboardListIcon,
  video_tutorial: FilmIcon,
  skill: WrenchIcon,
  recording: MicIcon,
  document: FileTextIcon,
};

export function ResourceCard({ resource }: { resource: Resource }) {
  const [playing, setPlaying] = useState(false);
  const TypeIcon = TYPE_ICONS[resource.resource_type];
  const style = RESOURCE_TYPE_STYLES[resource.resource_type];
  // A YouTube (or Loom/Vimeo) link plays in place; anything else — a Drive
  // doc, a PDF — still goes to its own page.
  const embedUrl = resource.content_url ? toEmbedUrl(resource.content_url) : null;

  const shell = cn(
    "group flex w-full flex-col overflow-hidden rounded-[7px] border border-sand border-l-[3px] bg-white/60 text-left transition-colors hover:border-t-ring-accent hover:border-r-ring-accent hover:border-b-ring-accent",
    style.border,
  );

  const body = (
    <>
      <div
        className={cn(
          "relative flex aspect-video items-center justify-center overflow-hidden",
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

        {embedUrl ? (
          <span className="absolute inset-0 flex items-center justify-center bg-umber/15 transition-colors group-hover:bg-umber/30">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream/90 pl-0.5 text-xl text-terracotta shadow-sm">
              <PlayIcon />
            </span>
          </span>
        ) : null}
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
    </>
  );

  if (!embedUrl) {
    return (
      <Link href={`/resources/${resource.id}`} className={shell}>
        {body}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label={`Watch ${resource.title}`}
        className={shell}
      >
        {body}
      </button>
      <VideoModal
        resource={resource}
        embedUrl={embedUrl}
        open={playing}
        onClose={() => setPlaying(false)}
      />
    </>
  );
}
