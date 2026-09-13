---
name: cureva-auth-sessions
description: "Fix Cureva login, owner provisioning, session loading, and logout without changing authentication contracts unnecessarily."
---

# Auth Sessions

Read the project profile, packages/types/auth-security.ts, modules/auth, security, providers/auth-provider.tsx, and lib/auth-token.ts. Login takes email/password and returns next=otp, set_password, or ready. Only ready carries an access token. A usable account requires verified email, completed password setup, and exactly one active ClinicUser relationship to an active Clinic.

Read [auth operations](../../references/auth-operations.md) for configuration and verification. Setup/recovery tokens stay in memory. Password changes revoke prior tokens. Do not auto-verify owners or existing users; local demo exceptions must remain explicitly configured and forbidden in production. Verify the process on the real port is running the rebuilt entry point before claiming the UI can use a new contract.

For provisioning explicitly requested by the user, hash with the existing bcrypt convention and create only the required records transactionally. Do not run the full demo seed to create one owner. Never store credentials or JWTs in agent memory, output artifacts, or logs.

After a write, verify persistence and call the actual login endpoint; record status and token presence without printing the token. Distinguish 401 invalid credentials, missing membership, transport failure, and authorization denial. For uncertain database writes, read back before retrying. Session changes must not introduce differing SSR and first-client markup.
