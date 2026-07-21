import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/server";
import { getMyCohort, getActiveCohort, requireUser } from "@/lib/auth";
import type { AppNotification } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: notificationRows }, { count: unreadCount }, cohort] =
    await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false),
      user.role === "admin" ? getActiveCohort() : getMyCohort(user.id),
    ]);

  const notifications = (notificationRows ?? []) as AppNotification[];

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} cohortName={cohort?.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          user={user}
          notifications={notifications}
          unreadCount={unreadCount ?? 0}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-9 lg:px-9 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
