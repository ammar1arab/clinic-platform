# System review progress - 2026-10-23

This is an initial verification pass, not a completed behavioral audit.

## Inventory

- API modules: 194 files; 20 controllers across API source.
- Web source: 365 files; 54 app files.
- Shared types package: 23 files.
- Concurrent changes to visits, queue, dashboard, clinic repository and auth contracts were preserved.

## Confirmed issues repaired

- The translation audit failed on an Arabic weekday/date pattern in `apps/web/src/lib/datetime.ts`. Both language patterns now belong to the existing `time` dictionaries and resolve through `getTranslations(lang)`.
- The agent-assets checker crashed when the optional, untracked `.vscode/tasks.json` was absent. It now validates editor tasks when present and continues checking canonical rules and links when absent.
- A historical review linked to the removed `clinic-lockup.tsx`; its replacement is `clinic-identity.tsx`.

## Verification

- Shared types and Nest API build passed.
- API Jest: 18 suites passed, 2 skipped; 153 tests passed, 28 skipped.
- Web TypeScript passed before repairs; final verification is recorded in task output.
- Translation audit passed after repair: 1835 keys and placeholder parity.
- No effect hooks were found by the initial web source scan.
- Initial UI import scan found error helpers, not direct Axios imports; this does not prove every data flow is correct.

## Remaining coverage

- Per-controller authorization, tenant ownership, DTO and shared response contract tracing.
- Public auth, scheduled workers, sockets, webhooks, concurrent writes and retry behavior.
- Query invalidation, form validation, mobile/desktop states and full shared overlay coordination.
- Authenticated HTTP and real browser verification. IronBee is unavailable in this session.
- Skipped integration tests were not enabled; no database migrations, emails or process restarts were performed.

Passing static checks and existing tests does not establish exhaustive business correctness. Do not mark the repository audit complete from this pass.

## Follow-up verification and fixes

- Installed IronBee DevTools 0.52.0 outside project dependencies and registered `ironbee-browser` in the user Codex MCP configuration. Its native tools became available in this session.
- Successfully signed in as practitioner and owner. Verified practitioner dashboard, visits list, theme/language selections, Arabic mobile rendering, owner dashboard and new-template preview. No clinical record was edited and no email was sent.
- Read stored clinical sections, report sections, invoice lines and template snapshots through runtime validation instead of double assertions. Four corruption/monetary-string tests were added; API tests now pass 157 tests, with 28 skipped.
- Replaced broad Select trigger metadata with actual trigger props; constrained overlay event generics to real dismiss-event capabilities; removed double assertions in IconCard event handlers.
- Added ScheduleRequestMutationResult to shared contracts and typed web service/mutation results; auth mutation errors use the existing normalized error contract.
- Removed redundant `as never` from both practitioner form resolvers. Web TypeScript and complete web ESLint passed (zero errors, zero warnings).
- TypeScript AST inventory found zero explicit any types. Unknown values at untrusted input boundaries remain intentional. Three production double assertions in AvailabilityStudio and test mock assertions still need review; the audit is not complete.
- New-template empty preview now fills remaining page height on desktop and mobile. Skeleton supports settings and publish views, follows the same flex layout, and replaces the previous null Suspense fallback. Verified actual preview screenshots at 1440x1000 and 390x844 through IronBee.

Screenshots are temporary task artifacts in /tmp/cureva-review, not durable fixtures. Broader per-route security/concurrency and all-screen behavioral coverage remain outstanding.
