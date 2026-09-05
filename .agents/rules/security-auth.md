# Authentication security

Read the project profile and existing security module before changing authentication.

Keep credential policy, token signing/validation, and rate limiting in security. Auth services own login and onboarding decisions; controllers validate transport input. Add files only for a concrete responsibility.

An access token requires verified email, completed password setup, and an active clinic membership. Validate token purpose, issuer, audience, expiry, and password version; load active role/membership from the database. A password change invalidates previously issued credentials, including recovery/setup grants.

OTP consumption and password changes must remain safe under concurrent requests. Store keyed OTP hashes, count failed verification atomically, consume once, and bind codes to their challenge and purpose. Recovery responses must not reveal whether the account exists, including through decoded JWT identifiers.

Rate limits must use shared persistent storage when API instances can scale. Do not silently fall back to per-process memory or disable limits when storage fails. Trust proxy headers only with explicitly configured trusted hops.

Demo OTP requires an exact email allowlist and an explicit code. Refuse that setting at production startup. Never log passwords, codes, JWTs, or hashes.

No migration automatically verifies existing users. Public registration cannot create clinic owners. Real email delivery is required outside explicitly allowed demo accounts.

Verify rejection paths and races in addition to the happy path. Use synthetic fixtures and mocked delivery for repeatable integration tests.
