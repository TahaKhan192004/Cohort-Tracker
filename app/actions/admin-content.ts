"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, getActiveCohort } from "@/lib/auth";
import type { ActionState } from "./auth";
import type { ResourceType } from "@/lib/types";

const RESOURCE_TYPES: ResourceType[] = [
  "sop",
  "video_tutorial",
  "skill",
  "recording",
  "document",
];

function readResourceForm(formData: FormData) {
  const type = String(formData.get("resource_type") ?? "document");
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    resource_type: (RESOURCE_TYPES as string[]).includes(type)
      ? (type as ResourceType)
      : ("document" as ResourceType),
    content_url: String(formData.get("content_url") ?? "").trim() || null,
    thumbnail_url: String(formData.get("thumbnail_url") ?? "").trim() || null,
    category: String(formData.get("category") ?? "").trim() || null,
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
  };
}

export async function createResource(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const cohort = await getActiveCohort();
  if (!cohort) return { error: "Create an active cohort first." };

  const values = readResourceForm(formData);
  if (!values.title) return { error: "Give the resource a title." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("resources")
    .insert({ ...values, cohort_id: cohort.id });

  if (error) return { error: error.message };

  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  redirect("/admin/resources");
}

export async function updateResource(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const values = readResourceForm(formData);

  if (!values.title) return { error: "Give the resource a title." };

  const supabase = await createClient();
  const { error } = await supabase.from("resources").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  return { success: "Resource saved." };
}

export async function deleteResource(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  return {};
}

/** Swap sort_order with the neighbour in the given direction. */
export async function moveResource(id: string, direction: "up" | "down") {
  await requireAdmin();
  const supabase = await createClient();

  const { data: resource } = await supabase
    .from("resources")
    .select("id, sort_order, cohort_id")
    .eq("id", id)
    .single();

  if (!resource) return { error: "Resource not found." };

  const { data: neighbour } = await supabase
    .from("resources")
    .select("id, sort_order")
    .eq("cohort_id", resource.cohort_id)
    [direction === "up" ? "lt" : "gt"]("sort_order", resource.sort_order)
    .order("sort_order", { ascending: direction !== "up" })
    .limit(1)
    .maybeSingle();

  if (!neighbour) return {};

  await Promise.all([
    supabase
      .from("resources")
      .update({ sort_order: neighbour.sort_order })
      .eq("id", resource.id),
    supabase
      .from("resources")
      .update({ sort_order: resource.sort_order })
      .eq("id", neighbour.id),
  ]);

  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  return {};
}

// ── Cohorts ──────────────────────────────────────────────────────

export async function createCohort(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const start = String(formData.get("start_date") ?? "");
  const end = String(formData.get("end_date") ?? "");
  const makeActive = formData.get("is_active") === "on";

  if (!name || !start || !end) {
    return { error: "Name, start date, and end date are all required." };
  }
  if (new Date(end) < new Date(start)) {
    return { error: "The end date comes before the start date." };
  }

  const supabase = await createClient();

  // Only one cohort is active at a time.
  if (makeActive) {
    await supabase.from("cohorts").update({ is_active: false }).eq("is_active", true);
  }

  const { error } = await supabase.from("cohorts").insert({
    name,
    start_date: start,
    end_date: end,
    is_active: makeActive,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/cohorts");
  return { success: "Cohort created." };
}

export async function setActiveCohort(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase.from("cohorts").update({ is_active: false }).eq("is_active", true);
  const { error } = await supabase
    .from("cohorts")
    .update({ is_active: true })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function archiveCohort(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cohorts")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/cohorts");
  return {};
}
