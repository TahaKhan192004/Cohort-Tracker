import { toEmbedUrl } from "@/lib/utils";

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const embed = toEmbedUrl(url);

  // Anything we can't turn into an embed (a Drive doc, a PDF) becomes a link.
  if (!embed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-[7px] border border-sand bg-white/60 px-4 py-3 text-sm text-espresso transition-colors hover:border-ring-accent"
      >
        Open resource ↗
      </a>
    );
  }

  return (
    <div className="overflow-hidden rounded-[7px] border border-sand bg-umber">
      <div className="relative w-full pt-[56.25%]">
        <iframe
          src={embed}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
