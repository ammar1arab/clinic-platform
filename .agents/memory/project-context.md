# Durable Cureva context

Reviewed 2026-09-04. Verify facts against the working tree before relying on them. This file records stable engineering decisions, not secrets or an automatic transcript.

- Product: multi-tenant clinic platform; roles owner, admin, practitioner, financial. Product phase requirements remain in AGENTS.md and the feature instructions.
- Structure: Next.js web in apps/web; Nest API in apps/api; shared contracts in packages/types. Read package manifests for current versions. npm is used per package.
- User preference: carry authorized work to completion with minimal repeated confirmation. Never interpret that preference as blanket permission for future destructive operations.
- UI: theme tokens from globals.css; logical direction classes; no new parallel palettes. Current layout chrome lives in components/layout; controls use nested ui/primitives directories.
- Language: EN/AR dictionaries under apps/web/src/i18n. No hardcoded translation fallbacks, inline bilingual copy, or any-typed translation objects. Helpers used while rendering receive the context locale.
- Auth: login takes an email, and an owner needs a Clinic, User, and ClinicUser. The UI's localhost URL does not establish that the database is local. Never save credentials here.
- Hydration: a stored Arabic locale must not differ from server English during the first render. Deterministic server snapshots solve that class of mismatch; theme warnings can be a recovery symptom.
- Verification: use existing IronBee browser tooling if available. Missing tooling must be reported. Generated .next errors are distinct from source errors; identify their cause rather than editing generated files.
- Maintenance: confirm the actual configured target for destructive requests, respect already-confirmed scope, use bounded operations, and verify committed postconditions.
- Knowledge maintenance: update this file only for durable, verified decisions. Put temporary task details in task output, not permanent instructions.

## 2026-10-19: clinical note-template builder overhaul

Multi-session pass on `apps/web/src/components/blocks/visits/note-template-builder.tsx` and its supporting hook/types. Verify each item against the working tree before assuming it still holds.

**Shared primitives changed (affect other screens too, not just the builder)**
- `apps/web/src/components/primitives/forms/multi-select.tsx`: trigger no longer renders unbounded chips (was blowing up to 200px+ tall on large selections) — shows a single "N selected" summary once anything is picked. Search box now uses the shared `SearchInput`; "select all / clear" is one tri-state `SelectionToggle` next to search instead of two text buttons. Affects every `MultiSelect` consumer (practitioners/departments/services pickers here, email composer's role/status filters).
- `apps/web/src/components/primitives/display/bilingual-name-fields.tsx`: the English-name field's placeholder now right-aligns (`placeholder:text-end`) only when site language is Arabic, matching the already-correct Arabic field. Fixes misaligned placeholders on every bilingual name field app-wide (practitioners, services, departments, rooms, templates).
- `apps/web/src/components/primitives/display/page-back.tsx` / `profile-chrome.tsx`: the `backLabel` prop was removed entirely (not just stopped-using) — every back button always renders the generic "Back"/"رجوع". This was explicitly requested twice; do not reintroduce destination-specific back labels anywhere.
- `apps/web/src/components/primitives/display/side-panel.tsx` (new): generic Card-based panel with `mobileSheet`/`open`/`onClose` for a panel that, on mobile, jumps to the top of its flex/grid container (`order-first`) with a highlight ring when active, instead of the old `sticky bottom-0` treatment (which stopped making sense once `page-fill` was fixed — see below). Used for the builder's Palette and Field Settings panels; reusable elsewhere.
- `apps/web/src/components/primitives/display/overflow-actions.tsx`: pre-existing shared chevron-scroll row (already used by the email composer's Variables/audience rows) — now also reused for the builder's tab bar and mobile palette strip instead of a plain `overflow-x-auto` div.
- `apps/web/src/app/globals.css` `@utility page-fill`: was unconditionally `height:0; flex:1 1 0%; overflow:hidden` (desktop-app-shell style, fixed viewport + inner-pane scrolling), applied even on mobile. Now that fixed-height behavior only applies `@media (min-width: 768px)`; below that it's a natural-flow flex column so the whole page scrolls like a normal mobile page. This utility is used in ~20 files across the app (lists, schedule, dashboard, email, visits) — the fix is global and was intentional per explicit user instruction, not scoped to just this page.

**Catalog modules (Service/Department/Room/PaymentMethod/Package/DiscountCode) — active/inactive consolidation**
- All six settings pages now use the shared `DirectoryActions` primitive for the desktop active-toggle instead of a hand-rolled `Switch` + manual `opacity-60` per page.
- PaymentMethod/Package/DiscountCode were missing a dedicated `/reactivate` endpoint (Service/Department/Room had one) — added repository method + controller route + service method + web hook/service for all three, matching the existing Service pattern.
- `packages/types/catalog.ts` was missing `isActive` on Create/Update input types for Service/Department/Room (API DTOs accepted it, shared types didn't) — added.
- Deliberately did NOT touch `ClinicUser.isActive` (checked on every authenticated request via `JwtStrategy`/`AuthRepository`), `Patient.isActive`, or `DoctorAvailability.isActive` (indexed, read by the booking engine's slot-matching in `appointments.service.ts`) — those are auth/booking-critical booleans, not a content-lifecycle status, and migrating them was explicitly descoped by the user after a risk discussion.

**Note-template status/lifecycle**
- `TEMPLATE_STATUS` (`packages/types/form.ts`) extended with `scheduled` alongside existing `draft`/`published`/`archived`. `ClinicalNoteTemplate.status` is a free-text Prisma column (not a Prisma enum), so this needed no schema enum migration — only a new nullable `scheduledAt DateTime?` column.
- **Migration `20261019120000_template_scheduled_at` has been applied** via `prisma migrate deploy` (confirmed `prisma migrate status` → "Database schema is up to date"). If you see 500s on `/clinical-note-templates` again, check `npx prisma migrate status` first — this exact class of bug (schema/DB drift) already happened once this session.
- New `TemplatePublishWorker` (`apps/api/src/modules/visits/template-publish.worker.ts`, registered in `visits.module.ts`), modeled on the existing `DocumentationRemindersWorker` pattern (setInterval, `TEMPLATE_PUBLISH_ENABLED` env flag, `unref()`), polls every 60s and promotes templates whose `scheduledAt` has passed via `TemplatesService.promoteScheduled()`.
- New `/clinical-note-templates/:id/schedule` endpoint + `ScheduleTemplateDto`; `TemplatesService.publish()` was refactored to extract a reusable `publishNow(tx, clinicId, row)` shared by the manual-publish and the worker's auto-promote path.
- Frontend: single `TEMPLATE_STATUS_VARIANT` map (`apps/web/src/constants/status.ts`) is the one place status→badge-color is defined, used by the header's status `Select` dropdown.
- The builder header (`PageBack` with `search`=tabs, `actions`=status/publish/schedule/archive/clone) now shows the status as a `Select` whose options trigger the corresponding mutation (draft is display-only, no un-publish/un-archive path exists on the backend).

**Known-fixed bugs this session (don't reintroduce)**
- `previewSections()` in `note-template-form.ts` used to require a title AND a labeled field on the *same* section to show it in Preview — a title in one section + a label in another produced a fully empty Preview. Now shows a section if it has a title OR a labeled field.
- Explicit Save/Publish/Schedule actions used to fail completely silently (no toast, no tab switch) when client-side validation (`templateProblems`) blocked them — e.g. tapping Save on a brand-new template with an empty name did nothing visible. Both `persist()` and `withSavedRecord()` in `use-note-template-builder.ts` now `toast.error(t.visits.templateIncomplete)` when that happens.
- `useUnsavedGuard`'s native `window.confirm()` "unsaved changes" dialog was removed from this builder (settings edits now autosave on the same debounce as schema edits, so there's nothing left to lose). The generic `useUnsavedGuard` util itself is untouched and still used by `clinical-note-editor.tsx`.

**Still open / unverified**
- User reported "review is not good... doesn't fit how it will be published exactly" with no reproducible detail given even after being asked directly. Investigated and found no code-level mismatch (Preview reuses the same `ClinicalFields` renderer as real visit-taking, and publish-time validation guarantees preview-complete content at publish time) — but this was not confirmed in a live browser. If it resurfaces, get a concrete repro (screenshot of Preview vs. the real visit note screen) before changing anything.
