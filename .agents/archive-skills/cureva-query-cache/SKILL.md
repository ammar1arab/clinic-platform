---
name: cureva-query-cache
description: "Implement or debug TanStack Query reads, invalidation, and optimistic mutations in Cureva."
---

# Query Cache

Start at constants/query-keys.ts, hooks/query/query-presets.ts, hooks/query/use-api-mutation.ts, and the relevant hooks/api file. Query keys must include the clinic and every input that changes returned data. Include locale only if the response itself changes with locale; translated client labels alone do not justify duplicating cache entries.

Use services for transport and the existing query helpers for lifecycle. For a write, list affected detail, list, aggregate, and billing views before choosing invalidation. Match existing INVALIDATE groups rather than invalidating the entire cache. Cancel relevant in-flight queries before optimistic changes, preserve a rollback snapshot, and reconcile with the server response.

Verify success, failure rollback, and switching clinic or filters. Avoid duplicate toasts between interceptors and mutation handlers. Keep cache data as domain data, not translated display strings. Reference: [TanStack query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys).
