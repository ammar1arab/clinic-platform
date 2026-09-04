# Cureva agent assets

Canonical rules and skills:

- `.cursor/rules/`
- `.cursor/skills/`
- `AGENTS.md` (repo root)

This folder mirrors the Cureva agent contract for tools that look under `.agents/`.

## Theme first

Every UI task stands on `apps/web/src/app/globals.css`.
See `.cursor/rules/theme.mdc` and `.cursor/skills/theme-ui/SKILL.md`.

## Quick pointers

- Identity + workflow: `.cursor/rules/00-project-core.mdc`
- Architecture: `.cursor/rules/architecture.mdc`
- Full-stack feature: `.cursor/skills/clinic-feature/SKILL.md`
- Ship: `.cursor/skills/ship-check/SKILL.md`
- Plan cycle: `.cursor/skills/agent-work-cycle/SKILL.md`
- i18n: `.cursor/skills/sync-i18n/SKILL.md`

## Hard preferences
- Banned: fallback operator with hardcoded string `t?.foo ?? 'String'`. Stand directly on `t.foo`
- Banned: inline language ternaries `lang === 'ar' ? '...' : '...'`. Put all strings in `en.ts` and `ar.ts`
- Banned: physical directional classes (`pl-`, `pr-`, `left-`, `right-`). Use logical properties (`ps-`, `pe-`, `start-`, `end-`)
- Prefer no `any`

