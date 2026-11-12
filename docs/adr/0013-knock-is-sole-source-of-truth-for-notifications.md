# Knock is the sole source of truth for notifications

Cadence has no local notifications table and no local preferences table. Knock stores the Notification Feed (items, read/unread state) and Notification Preferences (per-workflow per-channel-type toggles). The server logs trigger calls to the application logger for debugging, but doesn't persist them in the database. Knock's dashboard is the primary tool for tracing notification delivery.

## Considered Options

- **A local `notifications` table mirroring Knock.** Rejected: no feature queries notifications from our own DB, and syncing two systems creates a consistency problem with no current payoff.
- **A local `notification_preferences` table.** Rejected: mirroring preferences means two copies that can diverge. The settings page reads/writes Knock's API directly; the latency is acceptable.
- **A local `notification_events` audit table.** Rejected: standard application logging captures trigger successes and failures. A dedicated table adds schema and migration cost for something `grep` already solves.
