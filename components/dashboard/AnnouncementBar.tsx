"use client";

import Link from "next/link";
import { useState } from "react";
import { VideoModal } from "@/components/resources/VideoModal";
import { PlayIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/utils";
import type { Resource } from "@/lib/types";

/**
 * Highlights the newest call recording at the top of the dashboard. Plays in
 * place when the URL is embeddable, otherwise falls through to the resource
 * page (a Drive link, a PDF).
 */
export function AnnouncementBar({
  resource,
  embedUrl,
}: {
  resource: Resource;
  embedUrl: string | null;
}) {
  const [playing, setPlaying] = useState(false);

  const meta = resource.category?.trim() || formatDate(resource.created_at);

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 rounded-[7px] border border-ring-accent/50 border-l-[3px] border-l-terracotta bg-ring-accent/12 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta pl-0.5 text-lg text-cream">
          <PlayIcon />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-xs tracking-[0.1em] text-terracotta uppercase">
            Latest replay
          </p>
          <p className="mt-1 font-display text-lg leading-snug text-umber">
            {resource.title}
          </p>
          <p className="mt-0.5 text-xs text-smoke">{meta}</p>
        </div>

        {embedUrl ? (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="shrink-0 rounded-[7px] border border-terracotta bg-terracotta px-4 py-2 text-sm whitespace-nowrap text-cream transition-colors hover:border-umber hover:bg-umber"
          >
            Watch now
          </button>
        ) : (
          <Link
            href={`/resources/${resource.id}`}
            className="shrink-0 rounded-[7px] border border-terracotta bg-terracotta px-4 py-2 text-sm whitespace-nowrap text-cream transition-colors hover:border-umber hover:bg-umber"
          >
            Open
          </Link>
        )}
      </div>

      {embedUrl ? (
        <VideoModal
          resource={resource}
          embedUrl={embedUrl}
          open={playing}
          onClose={() => setPlaying(false)}
        />
      ) : null}
    </>
  );
}
