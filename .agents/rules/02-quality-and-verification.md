# Quality, Theme, and Verification

## Quality Constraints
- **No new `useEffect`:** Use TanStack Query, `useSyncExternalStore`, or existing hooks instead.
- **No `any`:** Strict TypeScript typings using `@clinic/types`, Prisma, or Zod.
- **Theme First:** Build on `apps/web/src/app/globals.css`. Never use hardcoded hex/rgb colors.
- **i18n & Localization:** Support EN/AR. Use logical RTL CSS properties (e.g., `margin-inline-start`, not `margin-left`). Avoid hydration mismatches with locales.

## Verification
- Run tests relevant to the touched area. Use synthetic data for testing.
- Run `npm test` for API, `npm run build` for packages/web.
- When changing translations, run `rtk proxy node scripts/check-i18n.cjs`.
- Clean up any processes or ports opened during the verification task.
