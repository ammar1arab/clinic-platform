---
name: theme-ui
description: >-
  Apply Cureva theme tokens from apps/web/src/app/globals.css to any UI work.
  Use when styling screens, fixing colors, spacing, dark mode, FullCalendar,
  loaders, brand chrome, or when the user mentions theme, tokens, or design
  system. Prefer this skill whenever visual classes are written in clinic-platform.
---

# Theme UI (Cureva)

## Stand on

`apps/web/src/app/globals.css` + `.cursor/rules/theme.mdc`

## Quick map

| Need | Class |
|------|--------|
| Page | `bg-background text-foreground` |
| Panel | `bg-card border-border` |
| Primary action | `bg-primary text-primary-foreground` |
| Quiet action | `bg-secondary text-secondary-foreground` |
| Muted text | `text-muted-foreground` |
| Brand | `bg-brand` / `text-brand` / `accent-teal` |
| Danger | `destructive` / `text-error` |
| Success / warn | `text-success` / `text-warning` |
| Focus | `ring-ring` |
| Radius | `rounded-md` / `rounded-lg` / `rounded-xl` |

## Workflow

1. Check primitives/blocks before new chrome
2. Compose with `cn()` from `@/lib/utils`
3. Translucency via `color-mix(in oklch, var(--color-*), …)` - not hex rgba
4. Missing token → add to `:root`, `.dark`, `@theme inline`, then use the class
5. Reuse `card-aura`, `fade-in`, `animate-shimmer`, `animate-clinic-*`
6. Keep FullCalendar on `--color-*`

## Reject

- Raw hex / rgb in TSX
- `bg-blue-500` / `text-gray-*` when semantic tokens exist
- New glow stacks that fight Cureva chrome
- Parallel CSS palettes

## Done when

- Light and dark still read as Cureva
- No new raw colors in feature files
