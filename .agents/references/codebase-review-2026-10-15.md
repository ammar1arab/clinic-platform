# Cureva codebase review - 2026-10-15

This source review found and fixed authorization, concurrency, recipient-review, export, and UI duplication defects. Existing staged work was preserved. No tests were added, changed, or run. No database was accessed, migration executed, email sent, or Git staging changed.

## Coverage

The inventory and structural scans covered 478 production TypeScript/TSX files, approximately 49,323 lines, across API, web, and shared contracts. Generated files and test files were excluded from those scans. Manual tracing focused on HTTP controllers, authentication and OTP, clinic ownership, settings and directories, appointment writes and billing, referrals and notifications, reports, email selection/dispatch/webhooks, query hooks, and the affected shared UI.

This is not a claim that every source line or every runtime scenario was manually verified. The configured IronBee browser was unavailable. Database execution and concurrency verification were outside the user's permitted checks. Existing tests were left intact, including tests that may encode the previous placement of conflict checks in the service.

## Findings addressed

1. **Critical: clinic IDs could select another tenant.** Several list/create endpoints trusted client clinic IDs, and settings record endpoints fetched by ID alone. Authenticated endpoints now derive their scope from membership; the JWT guard rejects conflicting submitted clinic IDs. Directory/settings repositories scope record reads and writes to the clinic, and related department/package/promocode ownership is checked. Settings mutations and patient mutations enforce server roles. Clinic details/staff/settings require the caller's clinic, with role restrictions on writes. See [JWT guard](../../apps/api/src/modules/auth/guards/jwt-auth.guard.ts#L9) and the updated controllers/services/repositories.

2. **Critical: production guest login could grant owner access without credentials.** The guest path is now rejected in production while the existing local demo flow remains available. See [guest login](../../apps/api/src/modules/auth/auth.service.ts#L143).

3. **High: unauthenticated sockets could join arbitrary clinic rooms.** Room joins now verify access-token purpose, expiry, current account and membership through the existing JWT strategy, and compare the requested clinic. Expired connections disconnect; logout/login disconnect the old client; leave events are handled. See [gateway](../../apps/api/src/modules/dashboard/dashboard.gateway.ts#L37) and [socket client](../../apps/web/src/lib/socket.ts).

4. **High: Send could replace the reviewed email recipients with a fresh selection.** Send now uses the displayed selection and hash, rejects a mismatched draft, and preserves the original payload/request ID for uncertain retries. Selection conflicts refresh the review query without automatically resending. Exclusions participate in the reviewed query; supplied external recipients are preserved; email recipient/preview cache keys include the clinic. Test content uses the current locale. See [composer submission](../../apps/web/src/hooks/api/use-email-composer.ts#L151), [composer](../../apps/web/src/components/blocks/emails/email-composer.tsx), and [query hooks](../../apps/web/src/hooks/api/use-emails.ts).

5. **High: concurrent appointment requests could both pass conflict checks.** Final conflict checks and writes now share a transaction and clinic-scoped advisory lock. One overlap query serves doctors and rooms, includes overnight overlaps, and applies the practitioner's buffer. Updates compare the source revision and return the translated `appointmentChanged` code when stale. See [transaction boundary](../../apps/api/src/modules/appointments/appointments.repository.ts#L38), [revision check](../../apps/api/src/modules/appointments/appointments.repository.ts#L48), and [overlap query](../../apps/api/src/modules/appointments/appointments.repository.ts#L343).

6. **High: billing state could be partially updated or overspent.** Package release is part of the cancellation update. Redemption rechecks ownership, activity, and remaining session/credit balance while holding the appointment lock. Payment/package writes recheck the appointment revision. Promocode usage is incremented conditionally within the appointment transaction, rolling back if booking fails. See [appointment repository](../../apps/api/src/modules/appointments/appointments.repository.ts#L106) and [update workflow](../../apps/api/src/modules/appointments/appointments.service.ts#L422).

7. **High: practitioner appointment access was broader than the UI.** Practitioner detail/update requests now scope appointments to the assigned practitioner; practitioner updates allow clinical status/notes fields rather than scheduling/pricing fields. Appointment creation is restricted to owner/admin. See [controller](../../apps/api/src/modules/appointments/appointments.controller.ts) and [service](../../apps/api/src/modules/appointments/appointments.service.ts#L422).

8. **High: notifications accepted another membership's user ID; referral decisions could race.** Notification reads and read updates use the authenticated clinic membership. Referral detail queries are clinic-scoped. Accept/reject now conditionally update a pending referral, so only one decision wins and triggers follow-up notifications. See [notifications controller](../../apps/api/src/modules/notifications/notifications.controller.ts#L22) and [referral transition](../../apps/api/src/modules/referrals/referrals.repository.ts#L67).

9. **Medium: exported CSV text could become spreadsheet formulas or extra preface rows.** Formula-like text is escaped, and preface lines use the same CSV quoting as data cells. See [CSV exporter](../../apps/api/src/modules/reports/exporters/csv.exporter.ts#L38).

10. **Medium: availability ignored effective dates and reparsed clinic-local strings using the host timezone.** Calendar dates and times now come from explicit timezone formatting; regular hours respect their date range and cannot accidentally cover an overnight slot. Explicit availability overrides remain supported. Duration must be a positive integer; fees and discounts cannot be negative. See [clinic clock](../../apps/api/src/modules/appointments/appointments.service.ts#L40) and [availability](../../apps/api/src/modules/appointments/appointments.service.ts#L258).

11. **Medium: rendering the clinic logo could write settings to the server.** Rendering now retains local image normalization without saving clinic settings. Explicit clinic saves invalidate email previews. See [clinic lockup](../../apps/web/src/components/layout/clinic-identity.tsx) and [clinic mutation](../../apps/web/src/hooks/api/use-clinic.ts).

12. **Cleanup and UI:** Patient/practitioner filters reuse one accessible `FilterSelect` in the existing form-field module. Appointment response includes and overlap logic are shared; obsolete service conflict/coupon methods were removed. Autofill uses theme colors without duplicated animation/cursor handlers. The practitioner table uses the existing translated default-room label. No generic CRUD framework or application dependency was introduced.

## Review guidance

The existing [Cureva Change Review skill](../skills/cureva-change-review/SKILL.md) now supports explicit repository audits, evidence-based findings, coverage reporting, transaction/tenant tracing, and restrained deduplication. Its external references are the official [OpenAI security guidance](https://github.com/openai/skills/blob/main/skills/.curated/security-best-practices/SKILL.md) and [Anthropic review workflow](https://github.com/anthropics/claude-code/blob/main/plugins/code-review/commands/code-review.md), inspected on the review date. Relevant ideas were adapted into the local skill rather than adding overlapping plugin bundles. No claim is made about future 2027 practices. Broken references to the absent theme rule now point to the existing quality/theme guidance.

## Verification and remaining limits

- Shared contracts build: passed.
- API build: passed.
- Web TypeScript check: passed.
- Web production build: passed; final rerun after recipient-conflict refresh is recorded in the task response.
- Source diff whitespace check: passed.
- Tests, database operations, email sending, migrations, and production access: not performed.
- Browser/visual acceptance and executable multi-worker/database concurrency checks remain unverified. Clinic-scoped serialization should be load-profiled before relying on high write throughput. These checks require an authorized follow-up environment; builds alone cannot establish runtime correctness.
