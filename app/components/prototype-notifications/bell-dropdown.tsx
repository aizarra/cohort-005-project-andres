// PROTOTYPE — bell icon + dropdown, 3 variants
import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Bell, Check } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  MOCK_NOTIFICATIONS,
  formatRelativeTime,
  groupByDay,
  type MockNotification,
} from "./mock-data";
import { NotificationTypeIcon } from "./notification-icon";

export function NotificationBell() {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get("variant") ?? "A";

  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const recent = notifications.slice(0, 10);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-1 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && variant === "A" && (
        <DropdownA
          notifications={recent}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
          onClose={() => setOpen(false)}
        />
      )}
      {open && variant === "B" && (
        <DropdownB
          notifications={recent}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
          onClose={() => setOpen(false)}
        />
      )}
      {open && variant === "C" && (
        <DropdownC
          notifications={recent}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant A — Minimal compact popover
// ---------------------------------------------------------------------------
function DropdownA({
  notifications,
  onMarkAllRead,
  onMarkRead,
  onClose,
}: DropdownProps) {
  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 rounded-lg border border-border bg-popover shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-sm font-semibold">Notifications</span>
        <button
          onClick={onMarkAllRead}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Check className="size-3" /> Mark all read
        </button>
      </div>
      <ul className="max-h-[380px] overflow-y-auto">
        {notifications.map((n) => (
          <li key={n.id}>
            <Link
              to={n.href}
              onClick={() => {
                onMarkRead(n.id);
                onClose();
              }}
              className={cn(
                "flex items-start gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent",
                !n.read && "bg-accent/40"
              )}
            >
              <span className="mt-0.5 shrink-0 text-muted-foreground">
                <NotificationTypeIcon type={n.type} className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("line-clamp-2 text-sm", !n.read && "font-medium")}>
                  {n.message}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatRelativeTime(n.timestamp)}
                </p>
              </div>
              {!n.read && (
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
              )}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t px-4 py-2.5 text-center">
        <Link
          to="/prototype/notifications"
          onClick={onClose}
          className="text-sm font-medium text-primary hover:underline"
        >
          See all notifications
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant B — Rich panel with day groups and actor avatars
// ---------------------------------------------------------------------------
function DropdownB({
  notifications,
  onMarkAllRead,
  onMarkRead,
  onClose,
}: DropdownProps) {
  const groups = groupByDay(notifications);

  return (
    <div className="absolute bottom-full left-0 mb-2 w-96 rounded-xl border border-border bg-popover shadow-2xl">
      <div className="flex items-center justify-between px-5 py-3">
        <h3 className="text-base font-bold">Notification Feed</h3>
        <button
          onClick={onMarkAllRead}
          className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium hover:bg-secondary/80"
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="sticky top-0 bg-popover/95 px-5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
              {g.label}
            </div>
            {g.items.map((n) => (
              <Link
                key={n.id}
                to={n.href}
                onClick={() => {
                  onMarkRead(n.id);
                  onClose();
                }}
                className={cn(
                  "flex gap-3 px-5 py-3 transition-colors hover:bg-accent",
                  !n.read && "bg-primary/5"
                )}
              >
                <div className="relative mt-0.5 shrink-0">
                  {n.actor ? (
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {n.actor.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </div>
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <NotificationTypeIcon type={n.type} className="size-4" />
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-popover bg-popover">
                    <NotificationTypeIcon type={n.type} className="size-3 text-muted-foreground" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm leading-snug", !n.read && "font-semibold")}>
                    {n.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelativeTime(n.timestamp)}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-2 size-2.5 shrink-0 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t px-5 py-3">
        <Link
          to="/prototype/notifications"
          onClick={onClose}
          className="flex w-full items-center justify-center rounded-md bg-secondary py-2 text-sm font-medium hover:bg-secondary/80"
        >
          See all notifications
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant C — Inbox-style dense rows
// ---------------------------------------------------------------------------
function DropdownC({
  notifications,
  onMarkAllRead,
  onMarkRead,
  onClose,
}: DropdownProps) {
  return (
    <div className="absolute bottom-full left-0 mb-2 w-[420px] rounded-lg border border-border bg-popover shadow-xl">
      <div className="flex items-center gap-3 border-b px-4 py-2.5">
        <Bell className="size-4 text-muted-foreground" />
        <span className="flex-1 text-sm font-semibold">Notifications</span>
        <button
          onClick={onMarkAllRead}
          className="text-xs text-primary hover:underline"
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
        {notifications.map((n) => (
          <Link
            key={n.id}
            to={n.href}
            onClick={() => {
              onMarkRead(n.id);
              onClose();
            }}
            className={cn(
              "flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-accent",
              !n.read && "bg-accent/30"
            )}
          >
            {!n.read ? (
              <span className="size-2 shrink-0 rounded-full bg-primary" />
            ) : (
              <span className="size-2 shrink-0" />
            )}
            <span className="shrink-0 text-muted-foreground">
              <NotificationTypeIcon type={n.type} className="size-4" />
            </span>
            {n.actor && (
              <span className="shrink-0 text-xs font-medium text-foreground/80 w-20 truncate">
                {n.actor.name.split(" ")[0]}
              </span>
            )}
            <span className={cn("min-w-0 flex-1 truncate", !n.read && "font-medium")}>
              {n.message}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
              {formatRelativeTime(n.timestamp)}
            </span>
          </Link>
        ))}
      </div>
      <div className="border-t px-4 py-2.5 text-center">
        <Link
          to="/prototype/notifications"
          onClick={onClose}
          className="text-sm text-primary hover:underline"
        >
          See all notifications →
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
interface DropdownProps {
  notifications: MockNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}
