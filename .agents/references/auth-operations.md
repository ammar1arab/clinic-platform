# Auth operations

The API is a modular monolith. Security lives in apps/api/src/security; login orchestration lives in modules/auth. Shared request/response and password rules live in packages/types/auth-security.ts. The web auth block composes the existing form, query and primitive layers.

## Deployment configuration

Set JWT_SECRET, DATABASE_URL and DIRECT_URL in the API environment. Configure RESEND_API_KEY and a verified RESEND_FROM sender for real email delivery. Set WEB_APP_URL to the application's public origin for practitioner welcome links.

All new/existing users start with emailVerifiedAt=null unless they actually verify. The auth migration does not reset passwords, seed data or verify accounts. Existing legacy tokens are rejected; sign in again.

Run prisma migrate deploy from apps/api with the reviewed migration. Build packages/types before building the apps. Access tokens expire after one hour; this slice intentionally has no refresh-session/device-management feature.

## Local demo accounts

In the ignored apps/api/.env, AUTH_FIXED_OTP=000000 enables the demo code only for comma-separated exact emails in AUTH_DEMO_EMAILS. Delete the AUTH_FIXED_OTP line to disable it. Restart the API after environment changes. Production startup rejects any AUTH_FIXED_OTP setting.

This is an explicit local test exception, not an email-delivery fallback. Ordinary accounts use the same delivery path in development and production. No code or token is logged or returned in a response.

## Verification

Run the package's TypeScript/build and lint commands. Run npm test -- --runInBand security for pure security tests. To run the database-backed HTTP suite, set AUTH_INTEGRATION=1 and load the API dotenv configuration before Jest. Example in PowerShell:

```powershell
$env:AUTH_INTEGRATION='1'
node -r dotenv/config node_modules/jest/bin/jest.js security --runInBand
```

The integration suite writes uniquely named synthetic clinic/user fixtures to the configured database, overrides email delivery, and cleans up its own rows. It requires an explicitly authorized test database. It does not use the demo OTP or send real email.

Browser acceptance: login, wrong/expired code, resend cooldown, first practitioner password, forgot/reset, keyboard/paste/autofill, Arabic/English, light/dark, mobile/desktop, reduced motion and blocked audio. Follow the project's runtime-tool rule and report unavailable verification.

## Boundaries

An access JWT is accepted only for a verified user with completed setup and exactly one active membership. Role and clinic state are rechecked server-side. Setup/recovery/reset credentials have separate purposes and remain only in browser memory.

The existing register endpoint is owner-authenticated and scoped to that owner's clinic; it creates an unverified account and never grants direct access.

Rate-limit rows are keyed with HMAC and updated atomically in PostgreSQL. Set TRUST_PROXY_HOPS to the exact number of trusted reverse proxies in deployment; the default zero ignores forwarded IPs. The auth guard uses the resulting client IP. Expired limit/challenge rows are pruned during subsequent auth activity.

OTP verification and password changes are single-use under concurrent requests. A password change revokes older access/setup/reset tokens and outstanding OTPs. Recovery uses opaque challenge identifiers so JWT payloads do not expose user existence.

A temporary success overlay uses the shared theme, supports reduced motion, and includes screen-reader feedback. Sound is prepared during user interaction and silently skipped if unavailable.
