"use client";

import { useState } from "react";
import { SidebarNav } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { signOut } from "@/app/actions/auth";
import type { AppNotification, AppUser } from "@/lib/types";

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
          className="rounded-[7px] border border-sand px-3 py-2 text-sm lg:hidden"
        >
          ☰
        </button>

        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm text-smoke">
            {user.role === "admin" ? "Admin" : "Participant"} ·{" "}
            <span className="text-espresso">{user.full_name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
