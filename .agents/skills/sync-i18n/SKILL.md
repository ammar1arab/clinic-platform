---
name: sync-i18n
description: >-
  Sync Cureva English and Arabic UI copy and bilingual entity fields. Use when
  adding or changing labels, toasts, nav, practitioner/queue/settings copy, or
  when the user mentions i18n, locale, bilingual, Arabic, RTL, setLocale, or
  translation namespaces in clinic-platform.
---

# Sync i18n (Cureva EN / AR)

## Goal

Keep EN and AR UI namespaces structurally identical, and keep entity `name`/`nameAr` (and bio pairs) complete.

## When UI i18n exists

1. Find every new/changed key (example: `practitioner:create.title`)
2. Update EN with clear clinic English
3. Mirror the same tree in AR with natural Arabic
4. Confirm identical key shape
5. Wire through project `t` / locale helper - no hardcoded Phase 2 strings
6. Rely on `dir` + logical CSS for RTL

Namespaces: `common`, `auth`, `practitioner`, `queue`, `notes`, `reports`, `settings`, `errors`.

## When only entity bilingual fields apply

1. EN + AR inputs for catalog/people data (department, room, service, practitioner)
2. Use `BilingualNameFields` or the same pattern
3. Persist both fields via API DTO + `@clinic/types`

## Rules

- No em dash
- Minimal diff
- Match tone of nearby Cureva strings

## Done when

- EN/AR keys match and/or `*Ar` fields are present
- No leftover hard-coded English on touched Phase 2 UI

## Current implementation

Use apps/web/src/i18n/en.ts and ar.ts, useLanguage for renders, and getTranslations for event-time utilities. Pass context t/lang into rendering helpers. Options come from translation-aware factories in constants; do not freeze English labels at module load. Validation messages must resolve the language at parse time.

Run rtk proxy node scripts/check-i18n.cjs from the root. Inspect both placeholder parity and caller behavior; structural parity alone is insufficient.
