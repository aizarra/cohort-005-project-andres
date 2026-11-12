# Research: Migrating Existing Postmark Emails to Knock

**Ticket**: #3 — Research migrating existing Postmark emails to Knock
**Date**: 2026-11-12

---

## Current State

Cadence sends transactional email through a thin abstraction in
`app/lib/mailer.server.ts`. The `sendEmail` function accepts `{ to, subject, body }`
and dispatches via one of two transports:

- **postmarkTransport** — calls `POST https://api.postmarkapp.com/email` with the
  `X-Postmark-Server-Token` header, sending plain-text email from
  `Cadence <hello@cadence.dev>` on the `outbound` message stream.
- **outboxTransport** — writes JSON to `.outbox/` for local dev and tests.

There are three call sites:

| Route                          | Purpose                          |
| ------------------------------ | -------------------------------- |
| `app/routes/admin.refunds.tsx` | Notify user of refund decision   |
| `app/routes/courses.$slug.refund.ts` | Confirm refund request raised |
| `app/routes/courses.$slug.purchase.tsx` | (Stub) Welcome email on enrollment |

All three call `sendEmail(result.email)` with a pre-built `Email` object. None use
HTML bodies or Postmark templates — every message is plain text assembled in
application code.

---

## 1. Postmark as a Knock Channel

Knock treats Postmark as a first-class email channel provider.

**Setup steps**:

1. In the Knock dashboard, go to **Channels and sources** and create a new Postmark
   channel.
2. Expand the target environment (Development, Production, etc.) and click
   **Manage configuration**.
3. Enter the **Postmark server API key** (the same `POSTMARK_SERVER_TOKEN` we use
   today).
4. Set the **From email address** (required) — e.g. `hello@cadence.dev`. This field
   supports Liquid tags for dynamic sender addresses.
5. Optionally set a **From name** override — e.g. `Cadence`.

**Postmark-side requirements**:

- The sending domain or address must have a **verified sender signature** in Postmark
  (we already have this for `hello@cadence.dev`).
- Messages default to the `outbound` transactional message stream, matching our
  current configuration.
- Delivery-status webhooks require a verified sender signature or domain if you want
  Knock to track bounces and deliveries.

**Automatic metadata** Knock injects into every Postmark email:

- `Metadata.sender` = `knock.app`
- `Metadata.knock_message_id` = the Knock message ID
- `Metadata.knock_recipient_id` = the recipient's Knock ID
- `Tag` = the originating workflow key

**Sandbox mode** can be enabled per-environment under Advanced settings to test
without sending real email.

> Source: [How to send email with Postmark — Knock docs](https://docs.knock.app/integrations/email/postmark)

---

## 2. Email Templates

Knock does **not** have standalone, reusable templates. Every template belongs to a
single channel step within a workflow.

**How it works**:

1. In the Knock dashboard, create a workflow (e.g. `refund-approved`).
2. Add an email channel step.
3. Click **Edit content** to open the template editor.
4. Build the email using either:
   - A **visual drag-and-drop editor** with pre-built components, or
   - A **code editor** for full control over HTML/Liquid markup.
5. Use **Liquid syntax** (`{{ data.variable_name }}`) to inject dynamic data passed
   in the trigger call.

**Passing dynamic data from the trigger**:

```ts
import Knock from "@knocklabs/node";

const knock = new Knock({ apiKey: process.env.KNOCK_API_KEY });

await knock.workflows.trigger("refund-approved", {
  recipients: [userId],
  data: {
    course_name: "Advanced TypeScript",
    refund_amount: "$49.00",
  },
});
```

Inside the template, reference these as `{{ data.course_name }}` and
`{{ data.refund_amount }}`.

**Additional data sources available in templates** (no trigger-time data needed):

- `recipient` — the recipient's Knock profile (name, email, custom properties)
- `actor` — the user/object who triggered the workflow
- `tenant` — tenant properties if a tenant ID was passed
- Arbitrary Knock users/objects via Liquid filters:
  `{% assign user = data.other_user_id | user %}`

**Email-specific settings** (from address, reply-to, cc, bcc) can be overridden at
the template level and support Liquid, e.g.:
```liquid
{{ actor.from_name | default: "Cadence" }}
```

> Sources:
> - [Working with templates — Knock docs](https://docs.knock.app/template-editor/overview)
> - [Referencing data in templates — Knock docs](https://docs.knock.app/template-editor/referencing-data)
> - [Email settings and overrides — Knock docs](https://docs.knock.app/integrations/email/settings)

---

## 3. Migration Path — Coexistence

Knock explicitly supports incremental migration where both systems run side-by-side.

**Recommended approach** (from Knock's implementation guide):

> "We recommend migrating your notifications by individual use cases/events rather
> than all use cases for a single delivery channel at a time."

This means we can:

1. **Keep direct Postmark calls** for existing email types (refund notifications,
   purchase confirmations) while they still work.
2. **Route new notification types** (e.g. in-app feed, digest emails) through Knock
   from the start.
3. **Migrate existing emails one-by-one** — e.g. move `refund-approved` to a Knock
   workflow, verify it works, then remove the direct Postmark call. Repeat for each
   email type.

This avoids the complexity of triggering both systems for the same event. Each email
is either fully Knock-managed or fully direct-Postmark; there is no split routing
needed for a single notification type.

**Within Knock itself**, if we later need to migrate between email providers (e.g.
Postmark to another ESP), Knock supports **channel groups** that can percentage-split
traffic between two providers with deterministic cohort assignment, enabling gradual
cutover with rollback capability.

> Sources:
> - [Implementing Knock — Knock docs](https://docs.knock.app/tutorials/implementation-guide)
> - [Sender domain migration — Knock docs](https://docs.knock.app/tutorials/sender-domain-migration)

---

## 4. Sender Identity

When using Postmark as a Knock channel, the sender name and address are configured at
**two levels**, with template-level settings taking precedence:

### Channel level (applies to all workflows using this channel)

- **From email address** (required): Set in the channel's environment configuration,
  e.g. `hello@cadence.dev`.
- **From name** (optional): e.g. `Cadence`.
- **Reply-to**, **cc**, **bcc**: Available under Advanced settings.

### Template level (per-workflow override)

- All the same fields appear at the top of the email template editor.
- All fields support **Liquid syntax**, enabling dynamic sender identity:
  ```liquid
  {{ actor.from_name | default: "Cadence" }}
  ```

### Constraints

- **Provider settings (API keys) cannot be dynamic** — they are fixed per
  environment.
- The sending address must match a **verified sender signature or domain** in
  Postmark, same as today.

To replicate our current setup, we set the channel-level from address to
`hello@cadence.dev` and from name to `Cadence`. No per-template overrides are needed
unless we want different sender identities for different workflows.

> Source: [Email settings and overrides — Knock docs](https://docs.knock.app/integrations/email/settings)

---

## Proposed Migration Plan for Cadence

Given the findings above, here is a concrete migration sequence:

1. **Set up Knock** — Create a Knock account, configure Postmark as an email channel
   using our existing `POSTMARK_SERVER_TOKEN`, set from address to
   `hello@cadence.dev`.

2. **Identify recipients** — Sync Cadence users into Knock (user ID + email) via the
   `@knocklabs/node` SDK's `users.identify()` method on login or account creation.

3. **Migrate emails one at a time**, starting with the simplest:
   - `refund-requested` (confirmation to student)
   - `refund-approved` / `refund-declined` (admin decision notification)
   - `enrollment-welcome` (currently a stub)

4. **For each email**: Create a Knock workflow, build the template in the dashboard,
   replace the `sendEmail()` call with `knock.workflows.trigger()`, and remove the
   old code path.

5. **Remove the mailer abstraction** once all emails are migrated. The
   `outboxTransport` for local dev is replaced by Knock's built-in sandbox mode.

6. **Add non-email channels later** (in-app feed, push) by adding channel steps to
   existing workflows — no new trigger code needed.
