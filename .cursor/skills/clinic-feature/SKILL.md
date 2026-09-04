---
name: clinic-feature
description: >-
  Create or extend a Cureva full-stack feature across Prisma, Nest, @clinic/types,
  web service, hooks, and UI blocks on theme tokens. Use for settings pages,
  practitioner flows, queue, appointments, reports, notifications, or any
  clinic-platform feature slice.
---

# Clinic feature (Cureva)

## Canonical path

1. Prisma (if needed) - `apps/api/prisma/schema.prisma`
2. Types - `packages/types`
3. Nest - `apps/api/src/modules/<feature>/`
4. Web service - `apps/web/src/services/<feature>.service.ts`
5. Hooks - `apps/web/src/hooks/api/use-<feature>.ts`
6. UI - `apps/web/src/components/blocks/<feature>/`
7. Route - `apps/web/src/app/(dashboard|auth)/...` (+ practitioner group when it exists) and `constants/routes.ts`

## Steps

1. Read a sibling end-to-end (patients, services, appointments) and match it
2. Theme: Tailwind token classes + `cn()` only
3. API: `clinicId` scope, guards, validation like siblings
4. Wire service → hooks → block → page (no Axios in components)
5. EN/AR UI keys and/or `name`/`nameAr` (and bio pairs) as required
6. Realtime only via existing socket / `use-clinic-realtime`
7. Verify with IronBee when UI changes. Close ports you started.

## Theme checklist

- [ ] No hex / raw rgb in TSX
- [ ] Surfaces: `bg-card` / `bg-background` / `border-border`
- [ ] Actions: `bg-primary` / status tokens
- [ ] Tailwind spacing scale
- [ ] Reused primitives before new chrome

## Roles reminder

Respect `owner` | `admin` | `practitioner` | `financial` surfaces. Do not expose owner-only finance/admin to practitioner shell.

## Done when

- Story works on real APIs for the intended role(s)
- Types, Nest, and web agree
- Diff is minimal and on-theme
