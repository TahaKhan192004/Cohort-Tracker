import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOnboardedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow } from "@/components/ui/Card";
import { ResourceTypeBadge } from "@/components/ui/Badge";
import { VideoEmbed } from "@/components/resources/VideoEmbed";
import { formatDate } from "@/lib/utils";
import type { Resource } from "@/lib/types";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOnboardedUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const resource = data as Resource | null;
  // RLS keeps other cohorts' resources out, so a miss is a genuine 404.
  if (!resource) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/resources" className="text-sm text-smoke hover:text-terracotta">
          ← Resources
        </Link>
      </div>

      <header>
        <Eyebrow>{resource.category ?? "Library"}</Eyebrow>
        <h1 className="mt-3 text-3xl leading-tight">{resource.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ResourceTypeBadge type={resource.resource_type} />
          <span className="text-xs text-smoke">
            Added {formatDate(resource.created_at)}
          </span>
        </div>
      </header>

      {resource.content_url ? (
        <VideoEmbed url={resource.content_url} title={resource.title} />
      ) : null}

      {resource.description ? (
        <div className="prose-brand text-sm">
          <p className="whitespace-pre-wrap">{resource.description}</p>
        </div>
      ) : null}
    </div>
  );
}
