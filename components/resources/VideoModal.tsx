"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { ExternalLinkIcon } from "@/components/ui/icons";
import type { Resource } from "@/lib/types";

/**
 * Plays an embeddable resource in place. The iframe only mounts while `open`
 * is true (Modal returns null when closed), so closing genuinely stops
 * playback instead of leaving audio running behind the overlay.
 */
export function VideoModal({
  resource,
  embedUrl,
  open,
  onClose,
}: {
  resource: Resource;
  embedUrl: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} size="lg" title={resource.title}>
      <div className="overflow-hidden rounded-[7px] border border-sand bg-umber">
        <div className="relative w-full pt-[56.25%]">
          <iframe
            // autoplay=1 is safe here: the modal only opens on a click, which
            // satisfies the browser's user-gesture requirement.
            src={`${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1&rel=0`}
            title={resource.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>

      {resource.description ? (
        <p className="mt-5 text-sm leading-relaxed whitespace-pre-wrap text-smoke">
          {resource.description}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
        <Link
          href={`/resources/${resource.id}`}
          className="text-smoke hover:text-terracotta"
        >
          Open full page
        </Link>
        {resource.content_url ? (
          <a
            href={resource.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-smoke hover:text-terracotta"
          >
            Watch on YouTube <ExternalLinkIcon />
          </a>
        ) : null}
      </div>
    </Modal>
  );
}
