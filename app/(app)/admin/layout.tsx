import { requireAdmin } from "@/lib/auth";

/** Single choke point: every /admin route is role-guarded here. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
