# Research: Knock's Workflow API and React SDK

> Wayfinder ticket #2 — researched 2026-11-12
> All citations reference primary sources at docs.knock.app unless noted otherwise.

---

## 1. Workflow API

### How workflows are defined

Workflows can be created in two ways:

- **Dashboard**: The Knock dashboard provides a visual workflow builder where you compose trigger → function steps → channel steps.
- **Management API / CLI**: Workflows can be created or updated programmatically via `PUT /v1/workflows/{workflow_key}` (development environment only), then committed and promoted through environments.

A workflow is a "triggered journey that sends notifications to your recipients." Each workflow has a unique `key` identifier and executes for a single recipient at a time (though triggers can address multiple recipients). Workflows contain two types of steps: **function steps** (batch, delay, branch, throttle, fetch) and **channel steps** (email, SMS, push, chat, in-app feed, webhook).

Source: [Workflows concept](https://docs.knock.app/concepts/workflows), [Management API](https://docs.knock.app/developer-tools/management-api)

### Workflow object shape (Management API)

```json
{
  "workflow": {
    "name": "New comment",
    "description": "Notify when a comment is posted",
    "categories": ["collaboration"],
    "tags": ["v1"],
    "settings": { "override_preferences": false },
    "trigger_frequency": "every_trigger",
    "trigger_data_json_schema": {
      "type": "object",
      "properties": {},
      "required": []
    },
    "steps": [
      {
        "type": "channel",
        "ref": "in_app_1",
        "channel_key": "in-app-feed",
        "channel_type": "in_app_feed",
        "template": {
          "subject": "{{ actor.name }} commented",
          "html_body": "<p>{{ data.comment_body }}</p>"
        }
      },
      {
        "type": "delay",
        "ref": "delay_1",
        "settings": { "delay_for": { "unit": "minutes", "value": 5 } }
      },
      {
        "type": "channel",
        "ref": "email_1",
        "channel_key": "postmark",
        "channel_type": "email",
        "template": {
          "subject": "New comment from {{ actor.name }}",
          "html_body": "<p>{{ data.comment_body }}</p>",
          "text_body": "{{ data.comment_body }}"
        }
      }
    ]
  }
}
```

All steps require unique `ref` identifiers and support optional `conditions` for conditional execution.

Source: [Workflows mAPI reference](https://docs.knock.app/mapi-reference/workflows)

---

## 2. Trigger API (Node.js)

### Endpoint

`POST /v1/workflows/{key}/trigger` (rate limit tier 5). All workflow runs are executed **asynchronously** — the call returns immediately with a `workflow_run_id`.

### Node.js SDK shape

```typescript
import Knock from "@knocklabs/node";

const knock = new Knock({ apiKey: process.env.KNOCK_SECRET_API_KEY });

const { workflow_run_id } = await knock.workflows.trigger("new-comment", {
  recipients: ["user_abc", "user_def"],   // up to 1,000 per call
  actor: "user_xyz",                       // who performed the action
  data: {                                  // up to 10 MB payload
    comment_id: "comment_123",
    comment_body: "Looks good!",
    project_id: "proj_456",
  },
  tenant: "team_acme",                     // optional multi-tenant context
  cancellation_key: "comment_123",         // for canceling pending runs
});
```

Recipients can also be **inline-identified** (upserted on trigger) by passing objects with `id` plus profile properties, or objects with `id` and `collection` for Object recipients.

Source: [Workflows trigger API reference](https://docs.knock.app/api-reference/workflows/trigger), [Triggering workflows via the API](https://docs.knock.app/send-notifications/triggering-workflows/api), [Node.js SDK migration guide](https://docs.knock.app/developer-tools/migration-guides/node)

---

## 3. Batching / Digest

Batching is configured as a **function step** in the workflow, placed before channel steps. It is not configured per-channel — it aggregates activities and then feeds the aggregated data to downstream channel steps.

### Batch window types

| Type | Behavior |
|------|----------|
| **Fixed** | Opens on first trigger, closes after a set duration (seconds, minutes, hours, or days). |
| **Dynamic** | Closes at an ISO-8601 timestamp or after a duration object passed via `data.batchDuration` / `data.batchUntil`. Also supports cron-like window rules (`frequency`, `days`, `hours`). |
| **Sliding** | Each new trigger extends the window by the configured duration, up to a max of 90 days. |

### Dynamic duration object example

```json
{ "unit": "minutes", "value": 15 }
```

Supported units: `"seconds"` | `"minutes"` | `"hours"` | `"days"` | `"weeks"`

### Window rule example (weekly digest)

```json
{
  "batchWindow": {
    "frequency": "weekly",
    "days": ["mon"],
    "hours": 9
  }
}
```

### Batch keys

By default batching groups on `recipient_id`. An optional batch key adds further grouping:
- Simple: `data.project_id`
- Compound: `{{data.eventType}}-{{actor.id}}`

The effective key becomes `concat(recipient_id, batch_key)`.

### Template variables available after batch closes

| Variable | Description |
|----------|-------------|
| `total_activities` | Count of activities in the batch |
| `total_actors` | Count of unique actors |
| `activities` | Array of up to 10 activity objects |
| `actors` | Array of up to 10 unique actor objects |

### Limits

- Max batch duration: 90 days
- Max activities per batch: 1,000 (configurable)
- Nested objects/arrays in data are stripped; strings capped at 256 chars
- Enterprise plans can render up to 100 items (default 10)

Source: [Batch function](https://docs.knock.app/designing-workflows/batch-function)

---

## 4. Preferences

### Model

A `PreferenceSet` is a JSON object with four top-level keys that control opt-out behavior:

```json
{
  "id": "default",
  "channel_types": {
    "email": true,
    "in_app_feed": true,
    "sms": false
  },
  "categories": {
    "collaboration": {
      "channel_types": { "email": false }
    }
  },
  "workflows": {
    "new-comment": {
      "channel_types": {
        "email": false,
        "in_app_feed": true
      }
    }
  },
  "channels": {
    "<channel-uuid>": true
  }
}
```

### Can a user set "in-app: on, email: off" for a specific workflow?

**Yes.** The `workflows` key accepts per-workflow objects, each containing a `channel_types` map. The example above shows exactly this: `new-comment` workflow with `email: false` and `in_app_feed: true`.

### Precedence

1. **Channel** preferences (by UUID) override **channel_types** (by type name) — more specific wins.
2. When multiple keys apply, **all** must evaluate to `true` for the notification to send. A single `false` blocks delivery.
3. Merge hierarchy (highest to lowest priority): recipient's preference set → environment default preference set. With tenants, tenant-specific recipient preferences sit on top.

### API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v1/users/{user_id}/preferences` | Get all preference sets |
| `PUT` | `/v1/users/{user_id}/preferences/{id}` | Set a preference set |
| `POST` | `/v1/users/bulk/preferences` | Bulk-set (up to 1,000 users) |

The PUT body accepts a `__persistence_strategy__` field: `"merge"` to merge with existing preferences, or the default behavior which replaces the entire set.

### Node.js SDK example

```typescript
await knock.users.setPreferences("user_abc", {
  id: "default",
  workflows: {
    "new-comment": {
      channel_types: {
        email: false,
        in_app_feed: true,
      },
    },
  },
});
```

Source: [Preferences overview](https://docs.knock.app/preferences/overview), [Preferences concept](https://docs.knock.app/concepts/preferences), [Set preferences API](https://docs.knock.app/api-reference/users/set_preferences)

---

## 5. In-App Feed

### How Knock stores and serves the feed

When a workflow runs and reaches an in-app feed channel step, Knock generates a `FeedItem` and stores it. Clients fetch a **reverse-chronological list** of feed items via the client API. Each `FeedItem` contains:

- Rendered content blocks (from templates)
- Timestamps: `inserted_at`, `updated_at`
- Engagement states: `seen_at`, `read_at`, `archived_at`
- The full `data` payload from the workflow trigger (e.g., `project_id`, `comment_id`)

Archived messages are excluded by default but can be filtered back in.

### Is Knock the sole source of truth?

**Yes, for in-app notifications.** Knock manages the complete lifecycle — storage, delivery, state management, and retrieval. There is no need to maintain a local notifications table. The data payload pass-through (`data.project_id`, etc.) lets you link back to your domain objects without duplicating notification state.

### Real-time delivery

Knock provides a **WebSocket connection** per user. Clients subscribe and receive `new-message` events. These events include updated badge counts (unseen/unread) but **not** the full message content — the client must fetch the full item separately or rely on the feed store to update.

### Feed API response metadata

The response includes a `FeedMetadata` object with:
- `total_count`
- `unread_count`
- `unseen_count`

### Feed endpoint filtering

Supports filtering by: tenant, archive status, custom `data` fields.

Source: [In-app APIs and real-time service](https://docs.knock.app/in-app-ui/api-overview), [Feeds overview](https://docs.knock.app/in-app-ui/feeds/overview)

---

## 6. React SDK (`@knocklabs/react`)

### Setup architecture

Three nested providers establish the connection:

```tsx
import {
  KnockProvider,
  KnockFeedProvider,
  NotificationIconButton,
  NotificationFeedPopover,
} from "@knocklabs/react";
import "@knocklabs/react/dist/index.css";

function AppLayout() {
  const [isVisible, setIsVisible] = useState(false);
  const notifButtonRef = useRef(null);

  return (
    <KnockProvider
      apiKey={process.env.KNOCK_PUBLIC_API_KEY}
      user={{ id: currentUser.id }}
    >
      <KnockFeedProvider feedId={process.env.KNOCK_FEED_CHANNEL_ID}>
        <NotificationIconButton
          ref={notifButtonRef}
          onClick={() => setIsVisible(!isVisible)}
        />
        <NotificationFeedPopover
          buttonRef={notifButtonRef}
          isVisible={isVisible}
          onClose={() => setIsVisible(false)}
        />
      </KnockFeedProvider>
    </KnockProvider>
  );
}
```

### WebSocket connection

The real-time WebSocket is established **automatically** by `KnockFeedProvider`. No manual socket setup is required. Options for socket management:

```tsx
<KnockFeedProvider
  feedId={process.env.KNOCK_FEED_CHANNEL_ID}
  defaultFeedOptions={{
    auto_manage_socket_connection: true,
    auto_manage_socket_connection_delay: 2500, // ms delay before disconnect on tab blur
  }}
/>
```

Cross-browser tab sync is available via `__experimentalCrossBrowserUpdates`.

### Pre-built components

| Component | Purpose |
|-----------|---------|
| `NotificationIconButton` | Bell icon with badge showing unseen/unread/all count (`badgeCountType` prop) |
| `NotificationFeedPopover` | Popover feed panel, positioned relative to the bell button |
| `NotificationFeed` | Standalone feed list (no popover) |
| `SlackChannelCombobox` | Slack channel picker (SlackKit) |
| `SlackAuthButton` | Slack OAuth button (SlackKit) |

### Headless hooks

For custom UI, the SDK provides hooks that bypass pre-built components:

| Hook | Returns |
|------|---------|
| `useKnockClient()` | The authenticated Knock client instance |
| `useNotifications(knockClient, channelId, options?)` | A `feedClient` with `fetch()`, `markAllAsSeen()`, etc. |
| `useNotificationStore(feedClient)` | `{ items, metadata }` where `metadata` includes `unread_count` and `unseen_count` |

Headless implementations must manually call `markAllAsSeen()` when the feed opens.

### Customization

- `colorMode`: `"light"` (default) or `"dark"`
- `onNotificationClick`, `onNotificationButtonClick` handlers
- `renderItem` prop for fully custom notification rendering

Source: [React overview](https://docs.knock.app/in-app-ui/react/overview), [React feed component](https://docs.knock.app/in-app-ui/react/feed), [Headless feed](https://docs.knock.app/in-app-ui/react/headless/feed), [NotificationIconButton](https://docs.knock.app/in-app-ui/react/sdk/components/notification-icon-button)

---

## 7. Resilience

### What happens when Knock is unreachable from the server?

If your server cannot reach Knock's API to trigger a workflow, the trigger call fails with a network error. **Knock does not provide a client-side queue or retry mechanism** — your application code must handle retries for the initial trigger call.

### Knock's internal retry/queue mechanisms

Once Knock has accepted a trigger, its internal pipeline is resilient:

| Stage | Retries | Strategy |
|-------|---------|----------|
| **Message delivery to provider** (e.g., SendGrid, APNS) | Up to **8 retries over 30 minutes** | Exponential back-off with jitter |
| **Delivery status checks** | Up to **10 attempts over 30 minutes** | Exponential back-off with jitter |
| **Workflow step execution** (template render, fetch step) | Up to **3 total attempts** | Automatic retry on transient errors |
| **Fetch function** (HTTP call within workflow) | **2 retries** (30s then 60s delay) | Fixed delay |

### Message states on failure

| State | Meaning |
|-------|---------|
| `queued` | Enqueued for delivery |
| `delivery_attempted` | Tried but failed |
| `bounced` | Provider rejected; no further retries |
| `undelivered` | All retries exhausted or non-retryable error |

Failed messages can be **manually retried** from the Knock dashboard.

**Implication for Cadence**: We should wrap `knock.workflows.trigger()` in a try/catch with our own retry logic (e.g., a job queue) to handle the case where Knock's API is temporarily unreachable.

Source: [Delivering notifications](https://docs.knock.app/send-notifications/delivering-notifications), [Message statuses](https://docs.knock.app/send-notifications/message-statuses), [Fetch function](https://docs.knock.app/designing-workflows/fetch-function)

---

## 8. Free Tier Limits and Message Counting

### How messages are counted

> "A message is counted each time a notification is successfully delivered to a single user on a single channel."

**One trigger → one recipient → two channels (in-app + email) = 2 messages.**

Messages are **not** counted when:
- A channel step is skipped due to user preferences
- Required data is missing and the step is skipped
- The message bounces or fails to deliver
- Sandbox mode is enabled

### Free tier

| Resource | Included |
|----------|----------|
| Messages | **10,000 / month** |
| Guide active users | 500 / month |
| AI agent credits | 500 / month |
| Channels | Unlimited |
| Team members | Unlimited |
| Recipients | Unlimited |
| Workflows | Unlimited |

The free plan's built-in test email channel is limited to **100 emails/month** (you bring your own email provider for production).

### Paid plans

- **Starter**: $250/month, 50,000 messages included, then $0.005/message.
- **Enterprise**: Volume-based pricing.

Source: [Knock plans and usage](https://docs.knock.app/manage-your-account/knock-plans), [Knock pricing](https://knock.app/pricing)

---

## Summary for Cadence

| Concern | Finding |
|---------|---------|
| Workflow definition | Dashboard + Management API; fully programmable |
| Trigger shape | Simple async call with recipients, data, actor, tenant |
| Batching | Flexible window types; sits as a step before channel steps |
| Per-workflow per-channel prefs | Fully supported; users can toggle in-app on / email off per workflow |
| In-app feed storage | Knock is sole source of truth; no local DB needed for notifications |
| React integration | Drop-in components + headless hooks; WebSocket is automatic |
| Resilience | Knock retries internally after acceptance; we must retry the initial trigger |
| Free tier budget | 10K messages/month; each channel delivery counts separately (in-app + email = 2) |
