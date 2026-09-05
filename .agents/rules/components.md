# Components

## Layers

1. `components/ui` - shadcn/Radix. Prefer `npx shadcn add`. Stay on theme tokens.
2. `components/primitives` - clinic-wide controls with no feature business (`FormField`, `DatePicker`, `BilingualNameFields`, `EmptyState`, …).
3. `components/blocks/<feature>` - feature composites (appointment form, patient table, dashboard KPIs, layout chrome).

Search that order before creating anything. Extend with variant/prop first.

## Theme

Obey `.agents/rules/theme.md` and `apps/web/src/app/globals.css`.
No hex. No off-palette ramps (`blue-500`, `gray-700`) when a semantic token exists.

## Patterns

- Named exports for components
- `cn()` from `@/lib/utils`
- Forms: react-hook-form + Zod (`@/lib/validations` or co-located when siblings do)
- Reuse `FormField`, `FormActions`, `PageBack`, `LoadingState`, `EmptyState`, `TableFrame`, `IconWell`
- Entity bilingual fields: `BilingualNameFields` for `name` / `nameAr` (same idea for `bio` / `bioAr` in Phase 2)

## Client boundaries

- `"use client"` only for hooks, events, or browser APIs
- Keep `page.tsx` thin; put interactive UI in blocks/primitives

## Do not

- Fork `components/ui` off design tokens
- Call Axios or services from `ui/` or dumb primitives
- Duplicate shell chrome - use `components/layout`
- Import marketing-site layout patterns; match Cureva dashboard density and tokens
