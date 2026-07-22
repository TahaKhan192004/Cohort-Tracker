"use client";

import { useState } from "react";
import { SidebarNav } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { signOut } from "@/app/actions/auth";
import { MenuIcon, ExternalLinkIcon } from "@/components/ui/icons";
import type { AppNotification, AppUser } from "@/lib/types";

const SURVEY_URL = "https://cohort-survey.aisavvyfounders.com/";

export function Navbar({
  user,
  notifications,
  unreadCount,
}: {
  user: AppUser;
  notifications: AppNotification[];
  unreadCount: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-sand bg-cream/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-5 py-3.5 lg:px-9">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          className="rounded-[7px] border border-sand px-3 py-2 text-lg text-espresso lg:hidden"
        >
          <MenuIcon />
        </button>

        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm text-smoke">
            {user.role === "admin" ? "Admin" : "Participant"} ·{" "}
            <span className="text-espresso">{user.full_name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* External host, so a plain anchor rather than next/link. Terracotta
              fill is the reserved CTA treatment — this is the one on the shell. */}
          <a
            href={SURVEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[7px] border border-terracotta bg-terracotta px-3 py-2 text-sm whitespace-nowrap text-cream transition-colors hover:border-umber hover:bg-umber"
          >
            <span className="sm:hidden">Survey</span>
            <span className="hidden sm:inline">Take the survey</span>
            <ExternalLinkIcon className="opacity-80" />
          </a>

          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
          />
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-[7px] border border-sand px-3 py-2 text-sm text-smoke transition-colors hover:bg-muted-warm hover:text-espresso"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-sand px-5 py-4 lg:hidden">
          <SidebarNav role={user.role} onNavigate={() => setMenuOpen(false)} />
        </div>
      ) : null}
    </header>
  );
}
