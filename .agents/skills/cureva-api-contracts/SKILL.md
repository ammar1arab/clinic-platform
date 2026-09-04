---
name: cureva-api-contracts
description: "Add or change a Nest endpoint and keep Prisma, shared types, services, hooks, and callers consistent."
---

# Api Contracts

Trace one existing endpoint from Nest controller through service/repository and packages/types to the web service and domain hook. Enumerate method, path, authentication, request validation, response shape, error behavior, and nullable fields before editing.

Add routes to constants/endpoints.ts and application navigation to constants/routes.ts where relevant. Keep Axios in services, TanStack Query lifecycle in hooks, and display logic in blocks. Do not hide contract errors with any, broad casts, or invented fields. Preserve backwards compatibility where an existing caller still needs the old shape.

Typecheck the changed packages and verify one serialized response and error case. For body-less deletes, match the helper's expected return. Ensure Accept-Language reaches shared transport for localizable server responses, but do not translate identifiers, enum wire values, or URLs.
