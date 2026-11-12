// PROTOTYPE — throwaway notifications page, 3 radically different variants
// Three variants of the /notifications page, switchable via ?variant=
import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { cn } from "~/lib/utils";
import { Bell, Check, CheckCheck, Filter, ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  MOCK_NOTIFICATIONS,
  formatRelativeTime,
  groupByDay,
  type MockNotification,
} from "~/components/prototype-notifications/mock-data";
import { NotificationTypeIcon } from "~/components/prototype-notifications/notification-icon";
import { PrototypeSwitcher } from "~/components/prototype-notifications/prototype-switcher";

export function meta() {
  return [{ title: "Notifications — Cadence (prototype)" }];
}

export default function NotificationsPrototype() {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get("variant") ?? "A";

  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  return (
    <>
      {variant === "A" && (
        <VariantA
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
        />
      )}
      {variant === "B" && (
        <VariantB
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
        />
      )}
      {variant === "C" && (
        <VariantC
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
        />
      )}
      <PrototypeSwitcher />
    </>
  );
}

interface VariantProps {
  notifications: MockNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Variant A — Simple vertical list, plain and clean
// ---------------------------------------------------------------------------
function VariantA({ notifications, onMarkAllRead, onMarkRead }: VariantProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount} unread
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onMarkAllRead}>
          <Check className="size-3.5" />
          Mark all read
        </Button>
      </div>

      <div className="space-y-1">
        {notifications.map((n) => (
          <Link
            key={n.id}
            to={n.href}
            onClick={() => onMarkRead(n.id)}
            className={cn(
              "flex items-start gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-accent",
              !n.read && "bg-accent/40"
            )}
          >
            <span className="mt-0.5 shrink-0 text-muted-foreground">
              <NotificationTypeIcon type={n.type} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm", !n.read && "font-medium")}>
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
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        You've reached the end.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant B — Card-based, grouped by day, prominent avatars
// ---------------------------------------------------------------------------
function VariantB({ notifications, onMarkAllRead, onMarkRead }: VariantProps) {
  const groups = groupByDay(notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bell className="size-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Notification Feed</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onMarkAllRead}>
          <CheckCheck className="size-3.5" />
          Mark all read
        </Button>
      </div>

      {groups.map((group) => (
        <div key={group.label} className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h2>
          <div className="space-y-2">
            {group.items.map((n) => (
              <Link
                key={n.id}
                to={n.href}
                onClick={() => onMarkRead(n.id)}
                className={cn(
                  "block rounded-xl border p-4 transition-all hover:shadow-md",
                  !n.read
                    ? "border-primary/20 bg-primary/5 shadow-sm"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    {n.actor ? (
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                        {n.actor.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </div>
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <NotificationTypeIcon
                          type={n.type}
                          className="size-5"
                        />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-card bg-card p-0.5">
                      <NotificationTypeIcon
                        type={n.type}
                        className="size-3 text-muted-foreground"
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        !n.read && "font-semibold"
                      )}
                    >
                      {n.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRelativeTime(n.timestamp)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      <p className="mt-4 text-center text-sm text-muted-foreground">
        That's everything.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant C — Dense inbox table with filter tabs
// ---------------------------------------------------------------------------
function VariantC({ notifications, onMarkAllRead, onMarkRead }: VariantProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const filtered =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Notifications</h1>
        <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
          <Check className="size-3.5" />
          Mark all read
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-1 border-b">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            filter === "all"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            filter === "unread"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Unread{unreadCount > 0 && ` (${unreadCount})`}
        </button>
      </div>

      <div className="divide-y divide-border rounded-lg border">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {filter === "unread"
              ? "No unread notifications."
              : "No notifications yet."}
          </div>
        ) : (
          filtered.map((n) => (
            <Link
              key={n.id}
              to={n.href}
              onClick={() => onMarkRead(n.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent",
                !n.read && "bg-accent/30"
              )}
            >
              {!n.read ? (
                <span className="size-2 shrink-0 rounded-full bg-primary" />
              ) : (
                <span className="size-2 shrink-0" />
              )}
              <span className="shrink-0 text-muted-foreground">
                <NotificationTypeIcon type={n.type} />
              </span>
              {n.actor && (
                <span className="w-24 shrink-0 truncate text-xs font-medium">
                  {n.actor.name}
                </span>
              )}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  !n.read && "font-medium"
                )}
              >
                {n.message}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                {formatRelativeTime(n.timestamp)}
              </span>
            </Link>
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          End of notifications
        </p>
      )}
    </div>
  );
}
