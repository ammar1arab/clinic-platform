---
name: cureva-realtime-sync
description: "Implement or debug clinic-scoped Socket.IO events and their effects on query caches and notifications."
---

# Realtime Sync

Read lib/socket.ts, hooks/api/use-clinic-realtime.ts, dashboard.gateway.ts, and the affected mutation path. Reuse the existing connection and clinic-room subscription. Verify room authorization on the server; a client join event is not proof of membership.

Map each event to the smallest required query invalidations. Resolve toast text at delivery time, so an old subscription does not retain an earlier language. Clean up exact handler references and leave the room on subscription disposal. Avoid duplicate connections or event handlers after remount/reconnect.

Check initial connect, reconnect, clinic change, and unmount for the changed behavior. Ensure an event reaches the intended clinic and does not leak another clinic's state. When testing is unavailable, report what was inspected and leave the runtime claim unverified.
