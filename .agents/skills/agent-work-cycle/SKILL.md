---
name: agent-work-cycle
description: >-
  Plan then implement then review for Cureva clinic-platform tasks. Use when the
  user wants a structured cycle, plan first, low token burn, or when starting a
  non-trivial Phase 2 feature, refactor, or API+UI change.
disable-model-invocation: true
---

# Agent work cycle (Cureva)

## Phase 1: Scope

1. Restate the goal in one sentence (owner vs practitioner vs both).
2. List in-scope / out-of-scope under `apps/web`, `apps/api`, `packages/types`.
3. Note rules/skills: `theme`, `theme-ui`, `sync-i18n`, `clinic-feature`, `ship-check`, IronBee.
4. Confirm Prisma / Nest / web contracts or list minimal schema + DTO + types work.
5. Give a short step list and continue authorized work. Pause after planning only when the user explicitly requested plan approval or a material decision is missing.

## Phase 2: Implement

1. Small diffs. Match sibling modules and blocks.
2. Theme tokens only (`globals.css`). No hex.
3. Prefer no new `useEffect`, no comments, no em dash.
4. Services → hooks → UI. Shapes in `@clinic/types`.
5. EN/AR sync for UI copy or bilingual entity fields.
6. Register paths in `constants/routes.ts` when adding screens.
7. Respect roles: `owner` | `admin` | `practitioner` | `financial`.

## Phase 3: Review

1. Diff against the plan
2. Run ship-check when shipping
3. IronBee browser for visible UI
4. Close ports you started
5. Report the result and remaining work in the current task.

## Token discipline

- No unrelated handbook dumps
- Prefer specific file reads once the map is known
- Start a new task only when the user asks.
