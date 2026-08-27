---
name: ship-check
description: >-
  Pre-ship verification for Cureva clinic-platform. Use before PR, deploy, or
  when the user asks to verify, check, lint, build, or confirm the app is ready.
disable-model-invocation: true
---

# Ship check (Cureva)

## Steps

1. **Theme:** UI uses `apps/web/src/app/globals.css` tokens only (no new hex / off-palette colors).
2. **i18n:** EN/AR keys match when UI i18n exists; bilingual entity fields include `*Ar` where required.
3. **Data:** Pages do not call Axios; services + hooks + `@clinic/types` align with Nest DTOs; `clinicId` scoping intact.
4. **Roles:** Practitioner surfaces do not expose owner-only finance/admin controls.
5. **Constraints:** Prefer no new `useEffect`, no drive-by comments, no em dash.
6. **Lint:** `npm run lint` in `apps/web` and/or `apps/api` when possible.
7. **Build:** For non-trivial changes, web and/or api build/typecheck when feasible.
8. **Runtime:** IronBee browser for UI; stop servers you started.
9. Report pass / fail / skipped. Do not commit or push unless asked.

## Done when

- Each check is reported clearly
- Remaining risks fit in one short paragraph
