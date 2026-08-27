# Cureva project rules (agents mirror)

Authoritative copies live in `.cursor/rules/`. Follow those files.

## Always

1. **Identity** - Cureva multi-tenant clinic product (`owner` | `admin` | `practitioner` | `financial`)
2. **Theme** - `apps/web/src/app/globals.css` tokens only. No hex in components.
3. **Minimal diffs** - smallest change that completes the task.
4. **Data flow** - UI → hooks → `services/*.service.ts` → Nest. No Axios in components.
5. **Types** - share contracts via `@clinic/types`.
6. **No invented APIs** - extend existing modules; scope by `clinicId`.
7. **Git** - commit/push/PR only when the user asks.

## Stack

Next.js 16 (`apps/web`) + NestJS 11 / Prisma (`apps/api`) + Tailwind v4 theme tokens + TanStack Query + Socket.IO. npm per package.

## Phase 2

Complete practitioner + owner control loop week by week. Do not cut hire, queue, email/OTP, 48h note lock, or the appointment engine.
