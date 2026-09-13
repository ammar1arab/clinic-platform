# Security and Tenant Integrity

## Authentication Security
- Enforce token purpose, issuer, audience, expiry, and password versions.
- Rate limits must use shared persistent storage; do not fall back to in-memory storage.
- Never log passwords, OTP codes, JWTs, or sensitive patient payloads.
- Prevent race conditions during OTP consumption and password resets.

## Tenant Isolation
- `clinicId` scopes everything. A client-provided `clinicId` is not sufficient for access control.
- Validate roles/permissions on the server-side for all requests. UI visibility is just presentation logic.
- Keep dependent state changes transactional in PostgreSQL via Prisma.
