"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Field";
import { SearchIcon, CloseIcon } from "@/components/ui/icons";

const DEBOUNCE_MS = 250;

/**
 * Writes the query to `?q=` so the page (a Server Component) does the actual
 * filtering and a search stays shareable/bookmarkable. `type` is carried along
 * so searching doesn't knock you off the tab you're on.
 */
export function ResourceSearch({
  query,
  type,
}: {
  query: string;
  type?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const [pending, startTransition] = useTransition();
  // Whatever we last put in the URL ourselves — lets us tell our own
  // navigations apart from external ones (back button, a cleared link).
  const pushed = useRef(query);

  useEffect(() => {
    if (query !== pushed.current) {
      pushed.current = query;
      setValue(query);
    }
  }, [query]);

  useEffect(() => {
    if (value === pushed.current) return;
    const timer = setTimeout(() => {
      pushed.current = value;
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (value.trim()) params.set("q", value.trim());
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/resources?${qs}` : "/resources", {
          scroll: false,
        });
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, type, router]);

  return (
    <div className="relative max-w-md">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-base text-smoke/70" />
      <Input
        // `text`, not `search` — WebKit adds its own clear button and we
        // render one that matches the brand.
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search resources…"
        aria-label="Search resources"
        className={pending ? "pr-10 pl-10 opacity-70" : "pr-10 pl-10"}
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-[4px] p-0.5 text-sm text-smoke transition-colors hover:text-espresso"
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );
}
