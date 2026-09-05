# Project profile: Cureva

This is the project-specific entry point to edit when adapting the generic rules and skills.

- Repository: clinic-platform.
- Architecture: modular monolith; Nest feature modules share PostgreSQL transactions. No microservice extraction without a demonstrated need.
- API: apps/api; NestJS, Prisma, PostgreSQL. Security infrastructure lives in src/security, business workflows in src/modules/auth.
- Web: apps/web; Next App Router, React, Tailwind, TanStack Query, react-hook-form and Zod.
- Shared wire contracts and pure password policy: packages/types, imported as @clinic/types.
- Data path: Prisma -> API repository/service/controller -> shared contracts -> web services -> hooks/api -> blocks -> thin routes.
- UI: components/ui for library controls, components/primitives for reused controls, components/blocks for feature workflows.
- Theme: apps/web/src/app/globals.css. Existing semantic tokens and motion; icons from constants/icons.
- Locale: en.ts/ar.ts under apps/web/src/i18n. useLanguage for rendering, getTranslations for event-time errors. Logical RTL styles.
- Tenant scope: ClinicUser is membership. Only one active clinic per user in the auth slice. Roles come from current database membership.
- Auth: six-digit OTP, fifteen-minute expiry, five attempts, sixty-second resend cooldown, five sends/hour. Limited-purpose tokens never enter persistent browser storage. No account is automatically verified.
- Email: existing Resend-backed EmailService. Missing delivery configuration fails auth email sending; explicit demo configuration is local-only.
- Source rules: .agents/rules. Source skills: .agents/skills. Other editor files are adapters.
- Package commands: npm per package. Build packages/types before consumers. API build: npm run build; API tests: npm test; web build: npm run build.
- Checks: scripts/check-i18n.cjs and scripts/check-agent-assets.cjs from root.
- Runtime browser: configured IronBee only. If unavailable, disclose the gap and finish permitted source/API checks.
- Shell wrapper: rtk; unsupported commands use rtk proxy.
- Commit/push/deploy only when requested. Stop only processes started for the current task.

Auth operations and integration-test instructions: [auth operations](references/auth-operations.md).
