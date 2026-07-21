"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { relativeTime } from "@/lib/utils";
import { BellIcon } from "@/components/ui/icons";
import type { AppNotification } from "@/lib/types";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: AppNotification[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        className="relative rounded-[7px] border border-sand px-3 py-2 text-espresso transition-colors hover:bg-muted-warm"
      >
        <BellIcon className="text-lg" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-[11px] tabular-nums text-cream">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-[7px] border border-sand bg-cream shadow-lg">
          <div className="flex items-center justify-between border-b border-sand px-4 py-3">
            <p className="text-sm text-espresso">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() =>
                  startTransition(() => {
                    void markAllNotificationsRead();
                  })
                }
                className="text-xs text-terracotta hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-smoke">
                Nothing new right now.
              </p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => {
                    setOpen(false);
                    if (!n.is_read) {
                      startTransition(() => {
                        void markNotificationRead(n.id);
                      });
                    }
                  }}
                  className={`block border-b border-sand/60 px-4 py-3 transition-colors last:border-0 hover:bg-muted-warm/60 ${
                    n.is_read ? "" : "bg-ring-accent/8"
                  }`}
                >
                  <p className="text-sm text-espresso">{n.title}</p>
                  {n.body ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-smoke">
                      {n.body}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-smoke/80">
                    {relativeTime(n.created_at)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
