import Link from "next/link";
import { requireOnboardedUser, getMyCohort } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow, EmptyState } from "@/components/ui/Card";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { cn } from "@/lib/utils";
import { RESOURCE_TYPE_LABELS, type Resource, type ResourceType } from "@/lib/types";

export const metadata = { title: "Resources — AI Savvy Founders" };

const TABS: { key: string; label: string; match?: ResourceType }[] = [
  { key: "all", label: "All" },
  { key: "recording", label: "Recordings", match: "recording" },
  { key: "video_tutorial", label: "Tutorials", match: "video_tutorial" },
  { key: "sop", label: "SOPs", match: "sop" },
  { key: "skill", label: "Skills", match: "skill" },
  { key: "document", label: "Documents", match: "document" },
];

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireOnboardedUser();
  const { type } = await searchParams;
  const active = TABS.find((t) => t.key === type) ?? TABS[0];

  const cohort = await getMyCohort(user.id);
  const supabase = await createClient();

  const { data } = cohort
    ? await supabase
        .from("resources")
        .select("*")
        .eq("cohort_id", cohort.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [] };

  const all = (data ?? []) as Resource[];
  const visible = active.match
    ? all.filter((r) => r.resource_type === active.match)
    : all;

  // Group by the free-text category so "Week 1", "Live Calls" etc. hold together.
  const byCategory = new Map<string, Resource[]>();
  for (const r of visible) {
    const key = r.category?.trim() || "Everything else";
    byCategory.set(key, [...(byCategory.get(key) ?? []), r]);
  }

  return (
    <div className="space-y-9">
      <header>
        <Eyebrow>Library</Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">
          Resources &amp; <span className="italic-verb">recordings</span>
        </h1>
        <p className="mt-2 text-sm text-smoke">
          Everything from the cohort in one place.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const count = tab.match
            ? all.filter((r) => r.resource_type === tab.match).length
            : all.length;
          if (tab.match && count === 0) return null;
          return (
            <Link
              key={tab.key}
              href={tab.key === "all" ? "/resources" : `/resources?type=${tab.key}`}
              className={cn(
                "rounded-[7px] border px-3.5 py-1.5 text-sm transition-colors",
                active.key === tab.key
                  ? "border-terracotta bg-terracotta text-cream"
                  : "border-sand text-smoke hover:bg-muted-warm hover:text-espresso",
              )}
            >
              {tab.label}
              <span className="ml-1.5 opacity-70">{count}</span>
            </Link>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description={
            all.length === 0
              ? "Recordings, SOPs, and tutorials will appear as your admin adds them."
              : `No ${RESOURCE_TYPE_LABELS[active.match!].toLowerCase()} resources yet.`
          }
        />
      ) : (
        [...byCategory.entries()].map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-4 text-lg">{category}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
