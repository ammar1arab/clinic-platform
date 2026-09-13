---
name: auth-challenges
description: "Implement or review email verification, password setup, and password recovery with one-use challenges."
---

Read [the project profile](../../project.md) first.

Read the project profile, security rules, schema and existing auth flow. Trace each credential from issuance through expiry and consumption. Ensure purpose separation and that unverified accounts cannot obtain access credentials. Exercise replay, resend invalidation, failed attempts, expiration, and concurrent resets. Use deterministic synthetic fixtures with intercepted delivery; never send test messages to real users.
