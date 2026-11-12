// PROTOTYPE — notification preferences, 3 variants
// Embedded in /settings via ?variant= param
import { useState } from "react";
import { useSearchParams } from "react-router";
import { cn } from "~/lib/utils";
import { Bell, BellOff, Mail, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  WORKFLOWS,
  CHANNELS,
  CATEGORY_LABELS,
  getDefaultPreferences,
  type PreferenceMap,
  type PreferenceCategory,
  type ChannelType,
  type NotificationWorkflow,
} from "./preferences-mock-data";
import { PrototypeSwitcher } from "./prototype-switcher";

export function NotificationPreferencesPrototype() {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get("variant") ?? "A";
  const [prefs, setPrefs] = useState<PreferenceMap>(getDefaultPreferences);

  function toggle(workflowId: string, channel: ChannelType) {
    setPrefs((prev) => ({
      ...prev,
      [workflowId]: {
        ...prev[workflowId],
        [channel]: !prev[workflowId][channel],
      },
    }));
  }

  function setAll(channel: ChannelType, value: boolean) {
    setPrefs((prev) => {
      const next = { ...prev };
      for (const w of WORKFLOWS) {
        next[w.id] = { ...next[w.id], [channel]: value };
      }
      return next;
    });
  }

  return (
    <>
      {variant === "A" && (
        <VariantA prefs={prefs} onToggle={toggle} onSetAll={setAll} />
      )}
      {variant === "B" && (
        <VariantB prefs={prefs} onToggle={toggle} onSetAll={setAll} />
      )}
      {variant === "C" && (
        <VariantC prefs={prefs} onToggle={toggle} onSetAll={setAll} />
      )}
      <PrototypeSwitcher />
    </>
  );
}

interface VariantProps {
  prefs: PreferenceMap;
  onToggle: (workflowId: string, channel: ChannelType) => void;
  onSetAll: (channel: ChannelType, value: boolean) => void;
}

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Variant A — Flat table with category headers
// ---------------------------------------------------------------------------
function VariantA({ prefs, onToggle, onSetAll }: VariantProps) {
  const categories = groupByCategory(WORKFLOWS);

  return (
    <Card className="mt-8 max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
          <span className="text-xs text-muted-foreground">
            Managed by Knock
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose how you want to be notified for each event.
        </p>
      </CardHeader>
      <CardContent>
        {/* Column headers */}
        <div className="mb-2 flex items-center justify-end gap-6 pr-1">
          {CHANNELS.map((ch) => (
            <span
              key={ch.id}
              className="w-14 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              {ch.label}
            </span>
          ))}
        </div>

        {categories.map(({ category, workflows }) => (
          <div key={category} className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {CATEGORY_LABELS[category]}
            </h3>
            <div className="space-y-1">
              {workflows.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{w.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {w.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {CHANNELS.map((ch) => (
                      <div key={ch.id} className="flex w-14 justify-center">
                        <Toggle
                          checked={prefs[w.id]?.[ch.id] ?? true}
                          onChange={() => onToggle(w.id, ch.id)}
                          label={`${w.label} ${ch.label}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Variant B — Separate cards per category, channel icons instead of labels
// ---------------------------------------------------------------------------
function VariantB({ prefs, onToggle, onSetAll }: VariantProps) {
  const categories = groupByCategory(WORKFLOWS);
  const channelIcons: Record<ChannelType, React.ReactNode> = {
    in_app: <Inbox className="size-3.5" />,
    email: <Mail className="size-3.5" />,
  };

  return (
    <div className="mt-8 max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <Bell className="size-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Toggle notifications per event and channel.
          </p>
        </div>
      </div>

      {categories.map(({ category, workflows }) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold">
              {CATEGORY_LABELS[category]}
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflows.map((w) => (
              <div key={w.id} className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{w.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {w.description}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  {CHANNELS.map((ch) => {
                    const on = prefs[w.id]?.[ch.id] ?? true;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => onToggle(w.id, ch.id)}
                        title={`${ch.label}: ${on ? "On" : "Off"}`}
                        className={cn(
                          "flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                          on
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {channelIcons[ch.id]}
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant C — Master toggles per channel, compact checklist
// ---------------------------------------------------------------------------
function VariantC({ prefs, onToggle, onSetAll }: VariantProps) {
  const categories = groupByCategory(WORKFLOWS);
  const allInApp = WORKFLOWS.every((w) => prefs[w.id]?.in_app);
  const allEmail = WORKFLOWS.every((w) => prefs[w.id]?.email);

  return (
    <Card className="mt-8 max-w-lg">
      <CardHeader>
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master toggles */}
        <div className="flex gap-4 rounded-lg border p-4">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">All in-app</span>
            </div>
            <Toggle
              checked={allInApp}
              onChange={() => onSetAll("in_app", !allInApp)}
              label="Toggle all in-app"
            />
          </div>
          <div className="border-l" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">All email</span>
            </div>
            <Toggle
              checked={allEmail}
              onChange={() => onSetAll("email", !allEmail)}
              label="Toggle all email"
            />
          </div>
        </div>

        {/* Per-workflow */}
        {categories.map(({ category, workflows }) => (
          <div key={category}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {CATEGORY_LABELS[category]}
            </h3>
            <div className="divide-y rounded-lg border">
              {workflows.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-4 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm">{w.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={prefs[w.id]?.in_app ?? true}
                        onChange={() => onToggle(w.id, "in_app")}
                        className="size-3.5 rounded border-border"
                      />
                      In-app
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={prefs[w.id]?.email ?? true}
                        onChange={() => onToggle(w.id, "email")}
                        className="size-3.5 rounded border-border"
                      />
                      Email
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-xs text-muted-foreground">
          Preferences are stored in Knock and applied to all future
          notifications.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
function groupByCategory(workflows: NotificationWorkflow[]) {
  const map = new Map<PreferenceCategory, NotificationWorkflow[]>();
  for (const w of workflows) {
    const list = map.get(w.category) ?? [];
    list.push(w);
    map.set(w.category, list);
  }
  return Array.from(map.entries()).map(([category, workflows]) => ({
    category,
    workflows,
  }));
}
