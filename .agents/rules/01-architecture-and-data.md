# Architecture and Data Rules

## Repository Structure
- **apps/web:** Next.js 16 App Router UI. Thin pages in `app/`. UI components in `components/ui` (shadcn) and `components/primitives`. Feature blocks in `components/blocks`.
- **apps/api:** NestJS + Prisma API. Controllers handle routing; business logic in services.
- **packages/types:** Shared HTTP contracts (`@clinic/types`).

## Web Data Flow
- `page/block` → `hooks/*` → `services/*.service.ts` → `api` (Axios) → Nest API.
- Do not call Axios directly from UI components. Use `hooks/query` (TanStack Query) for data fetching and mutations.
- Keep auth headers managed centrally in `lib/api`.

## API Contracts
- Keep wire enums aligned with Prisma enums.
- Update `packages/types` whenever API shapes change, then update both Nest and Web.
- Controllers should remain thin and use class-validator DTOs.
