"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
}

const PARTICIPANT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "My Tasks" },
  { href: "/resources", label: "Resources" },
  { href: "/profile", label: "Profile" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Participants" },
  { href: "/admin/tasks", label: "Tasks" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/notifications", label: "Activity" },
  { href: "/admin/cohorts", label: "Cohorts" },
];

function isActive(pathname: string, href: string) {
  // "/admin" would otherwise light up for every admin sub-route.
  if (href === "/admin" || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = role === "admin" ? ADMIN_NAV : PARTICIPANT_NAV;

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-[7px] px-3 py-2 text-sm transition-colors",
              active
                ? "bg-muted-warm text-espresso"
                : "text-smoke hover:bg-muted-warm/60 hover:text-espresso",
            )}
          >
            {item.label}
          </Link>
        );
      })}

      {role === "admin" ? (
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="mt-4 border-t border-sand px-3 pt-4 text-sm text-smoke transition-colors hover:text-terracotta"
        >
          View as participant →
        </Link>
      ) : null}
    </nav>
  );
}

export function Sidebar({ role, cohortName }: { role: Role; cohortName?: string }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-sand px-5 py-8 lg:block">
      <Link href={role === "admin" ? "/admin" : "/dashboard"} className="block">
        <p className="font-display text-lg leading-tight text-umber">
          AI Savvy <span className="italic-verb">Founders</span>
        </p>
        <p className="mt-0.5 text-xs text-smoke">
          {cohortName ?? "Cohort Tracker"}
        </p>
      </Link>

      <div className="mt-9">
        <SidebarNav role={role} />
      </div>
    </aside>
  );
}
