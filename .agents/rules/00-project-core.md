# Cureva core

## Identity

**Cureva** (`clinic-platform`) is a multi-tenant clinic operations product.

- Roles: `owner` | `admin` | `practitioner` | `financial`
- Staff row: `ClinicUser` (scoped by `clinicId`)
- Appointments: statuses `unconfirmed` → `confirmed` → `checked_in` → `waiting` → `in_progress` → `completed` | `no_show` | `cancelled`
- Availability: `DoctorAvailability` + `DoctorTimeOff`
- Realtime: Socket.IO clinic rooms + appointment/notification events
- Shared contracts: `@clinic/types`

Phase 2 completes the practitioner side and the owner controls around that practitioner on this codebase. It does not start a second product.

## Stack

| Layer | Choice |
|-------|--------|
| Web | Next.js 16 App Router, React 19, TypeScript (`apps/web`) |
| API | NestJS 11, Prisma 7, PostgreSQL (`apps/api`) |
| Types | `@clinic/types` (`packages/types`, `file:` linked) |
| Styling | Tailwind v4 CSS-first in `apps/web/src/app/globals.css` + shadcn `radix-nova` |
| Data (web) | TanStack Query + Axios (`services/` + `hooks/`) |
| Realtime | Socket.IO (`DashboardGateway`, `use-clinic-realtime`) |
| Forms | react-hook-form + Zod |
| Icons | lucide-react |
| Package manager | npm in each package (`apps/web`, `apps/api`, `packages/types`) |

Keep Next patterns in web and Nest patterns in api. Never cross-import the two apps.

## Theme first

Every UI task stands on `.agents/rules/02-quality-and-verification.md` and `apps/web/src/app/globals.css`.
No hardcoded hex/rgb. No parallel design system.

## Absolute constraints

- **No `useEffect` and no `useLayoutEffect`.** Data loads through TanStack Query. Subscribe with `useSyncExternalStore`. Measure with a ref callback that returns its cleanup. React to images with `onLoad`. Do not add an effect whose only job is to fetch.
- Prefer **no code comments** unless the logic cannot be made clear by naming.
- Prefer **no `any`**. Narrow types from `@clinic/types`, Prisma, or Zod.
- Never use the em dash character. Use a normal hyphen `-`.
- Commit, push, or open PRs only when the user explicitly asks.
- Do not invent API endpoints or Prisma fields. Extend existing modules; ask if the contract is unclear.
- Minimal diffs. Do not refactor unrelated code.

## Code shape

- Fewer files and fewer lines. DRY.
- Reuse `components/ui`, `components/primitives`, `components/blocks`, `hooks`, `lib`, `services` before adding abstractions.
- Search before creating a util. If one might already exist, ask first.
- Write Tailwind at the usage site with `cn(...)`. Do not extract page layout class strings into constants unless that file already does.

## Web data flow

```
page / block  →  hooks/*  →  services/*.service.ts  →  api (Axios)  →  Nest
```

- Pages and UI do not call Axios.
- Services use `api` from `@/lib/api` only.
- Hooks: `hooks/query` (TanStack), `hooks/shared` (UI utils), `hooks/api` (domain); Axios + QueryClient stay in `lib/`.

## Shared types and routes

- Wire shapes both sides need go in `packages/types`, then typecheck.
- App paths go through `apps/web/src/constants/routes.ts`.

## Memory

Any-project craft and screen rules live in `.agent-library/rules/00-core.md` and `.agent-library/rules/20-ui-localization.md` when that folder is present. This file still wins on Cureva facts.

- Edit only the node the user pointed at. Reuse skeleton, spinner, empty, and error components. One control, one job. Tips only on icon-only or cut-off controls. Focus is a border color change only.
- One scroll owner. Leave a list where the user placed it. A named ratio stays (`2fr` / `3fr` for a 40% preview) on every screen that shares the pane. "Left" and "right" are the sides of the monitor.
- Chips stay one row; arrows only when they overflow; in Arabic, flip the icon and the scroll distance. Name cells follow the page direction. Table headers stick in the scrolling box. Short badge text; the sentence is the tooltip. Count badges use the brand color.
- Product words only. Email screens say email, not message. A local hide filters the list already loaded. Persist only real columns. Inbox images are attached files, not data URLs or SVG. Search delay lives in the shared search field.
- Empty body still leaves space between a letter header and its footer icons.
- A reload keeps an upload and the sidebar width. Show the uploaded file with no extra caption and no fill behind it. A new file replaces the old one.
- Clinic color is applied on `documentElement` for light and dark. No raw hex in the app. Email HTML may use hex because mail clients cannot read CSS variables.
- English and Arabic keys stay identical. Sessions are «وجاهي» and «اونلاين». The report note is «ملاحظة التقرير».
- The clinic image stays in the sidebar and the browser icon, not in the top bar.
- A test email goes to the signed-in user, not the selected audience. Audiences are everyone, patients, doctors, staff, finance, super admins, and sub admins.
- Use the local Prisma binary. Do not run a casual migration. Do not send real mail while changing the composer.
- Verify with IronBee when it is available. Light, dark, English, and Arabic stay correct. A crushed card, a second scrollbar, or a wrapped chip row means the layout is not done.

## Workflow

1. Read the task and Phase 2 week/story if relevant.
2. Check Prisma, Nest modules, web services/hooks, and UI blocks.
3. Confirm contracts exist (or plan the minimal schema + DTO + types change).
4. Flag unclear business rules before coding.
5. Ask numbered questions when blocked. Match existing style.
6. For large work: plan first and wait for approval when the user wants a cycle.
7. Implement small diffs. Theme tokens. EN/AR when i18n or bilingual fields apply.
8. Verify on the running app (IronBee browser for UI). Close ports you opened.
9. Git only when asked.

## Phase 2 cut order

If scope slips, cut polish on history filters, fancy report formatting, and extra socket event types first.
Do not cut practitioner create, daily queue, email/OTP auth, 48h note lock, or the appointment engine (availability, buffer, room, live session).
