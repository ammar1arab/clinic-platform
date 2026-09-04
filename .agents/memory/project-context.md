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
