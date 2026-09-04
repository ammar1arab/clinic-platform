---
name: cureva-auth-sessions
description: "Fix Cureva login, owner provisioning, session loading, and logout without changing authentication contracts unnecessarily."
---

# Auth Sessions

Read modules/auth/dto/login.dto.ts, auth.service.ts, jwt.strategy.ts, providers/auth-provider.tsx, and lib/auth-token.ts. The current login contract takes an email and password, not a username. A usable account requires User plus an active ClinicUser relationship to a Clinic; creating only User is insufficient.

For provisioning explicitly requested by the user, hash with the existing bcrypt convention and create only the required records transactionally. Do not run the full demo seed to create one owner. Never store credentials or JWTs in agent memory, output artifacts, or logs.

After a write, verify persistence and call the actual login endpoint; record status and token presence without printing the token. Distinguish 401 invalid credentials, missing membership, transport failure, and authorization denial. For uncertain database writes, read back before retrying. Session changes must not introduce differing SSR and first-client markup.
