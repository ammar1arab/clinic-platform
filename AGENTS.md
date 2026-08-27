# Cureva (clinic-platform) - Agent guide

Multi-tenant clinic product: JWT auth, roles (`owner` | `admin` | `practitioner` | `financial`), appointments, queue, settings, reports, Socket.IO, and Phase 2 practitioner completion.

## Always stand on theme

Follow `.cursor/rules/theme.mdc`.
Source: `apps/web/src/app/globals.css` (`:root`, `.dark`, `@theme inline`).
No hardcoded hex/rgb. No parallel palette.

## Stack

| Layer | Choice |
|-------|--------|
| Web | Next.js 16 App Router, React 19, Tailwind v4, shadcn, TanStack Query, Axios |
| API | NestJS 11, Prisma 7, PostgreSQL, Socket.IO, JWT |
| Types | `@clinic/types` (`packages/types`) |
| Packages | npm per app (`apps/web`, `apps/api`, `packages/types`) |

## Folder instincts

- Blocks: `apps/web/src/components/blocks/`
- Primitives: `apps/web/src/components/primitives/`
- shadcn: `apps/web/src/components/ui/`
- Data: `services/` → `hooks/api/` → pages
- Query helpers: `hooks/query/`; shared UI hooks: `hooks/shared/`
- Icons: `@/constants/icons` only (no direct `lucide-react` in UI)
- Static maps: `@/constants/*` (appointment status, form sentinels, …)
- Nest: `apps/api/src/modules/<name>/`
- Routes: `apps/web/src/constants/routes.ts`

## Rules (`.cursor/rules`)

| File | When |
|------|------|
| `theme.mdc` | Always - design tokens |
| `00-project-core.mdc` | Always - identity, stack, bans, workflow |
| `architecture.mdc` | Always - placement |
| `components.mdc` | Web TSX/CSS |
| `api-data.mdc` | Services, hooks, Nest, types |
| `i18n.mdc` | Bilingual / RTL |
| `ironbee-devtools-use.mdc` | Runtime verify |
| `close-ports-when-done.mdc` | Stop servers you started |

## Skills (`.cursor/skills`)

| Skill | Use for |
|-------|---------|
| `theme-ui` | Any styling / visual work |
| `clinic-feature` | Full-stack Cureva feature slices |
| `sync-i18n` | EN/AR copy and bilingual fields |
| `agent-work-cycle` | Plan → implement → review |
| `ship-check` | Pre-ship verification |

## Hard preferences

- Prefer no new `useEffect`
- Prefer no code comments
- Prefer no `any`
- No em dash
- Do not invent endpoints
- Commit / push / PR only when asked
- Phase 2 week order; do not cut hire, queue, email/OTP, 48h note lock, or appointment engine

## Runtime

- Prefer TanStack Query / existing hooks over ad hoc effects
- Keep EN and AR in sync when i18n or bilingual fields apply
- Verify UI with IronBee browser tools only
- Close ports opened during the session when finishing
