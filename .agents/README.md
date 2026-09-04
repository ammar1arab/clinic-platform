# Cureva agent guide

Reviewed 2026-09-04. These are repository instructions, not permanent account memory. Future tasks must open this repository to discover them. Installed framework versions remain authoritative.

## Where to explore

- [Root instructions](../AGENTS.md): entry point and non-negotiable project conventions.
- [Cursor rules](../.cursor/rules): canonical rules, with narrow file scopes for detailed guidance.
- [Project memory](memory/project-context.md): durable decisions and known pitfalls, without credentials.
- [Official sources](references/official-sources.md): sources consulted and scope of currency claims.
- [Legacy skills](../.cursor/skills): theme-ui, clinic-feature, sync-i18n, agent-work-cycle, ship-check.

## 20 new project skills

Use the matching skill when its description fits; do not load all 20 for every task. In Codex, reference the skill by name (for example `$cureva-hydration`); if the current session has not refreshed discovery, point it directly to the SKILL.md file. Cursor also discovers .agents/skills.

| Skill | Use it for |
|---|---|
| [cureva-triage](skills/cureva-triage/SKILL.md) | Trace a Cureva bug from its visible symptom to the responsible web, API, or database layer before changing code. |
| [cureva-hydration](skills/cureva-hydration/SKILL.md) | Diagnose SSR hydration mismatches involving language, theme, authentication, storage, dates, or generated markup in the Next.js app. |
| [cureva-query-cache](skills/cureva-query-cache/SKILL.md) | Implement or debug TanStack Query reads, invalidation, and optimistic mutations in Cureva. |
| [cureva-tenant-access](skills/cureva-tenant-access/SKILL.md) | Review or implement clinic isolation and role authorization for Cureva endpoints and related UI. |
| [cureva-auth-sessions](skills/cureva-auth-sessions/SKILL.md) | Fix Cureva login, owner provisioning, session loading, and logout without changing authentication contracts unnecessarily. |
| [cureva-prisma-migrations](skills/cureva-prisma-migrations/SKILL.md) | Design and verify a Prisma schema or migration change for the clinic database. |
| [cureva-appointment-engine](skills/cureva-appointment-engine/SKILL.md) | Change appointment scheduling, availability, queue transitions, or rescheduling with domain invariants intact. |
| [cureva-billing-packages](skills/cureva-billing-packages/SKILL.md) | Change fees, discounts, payment status, session packages, or credit redemption in Cureva. |
| [cureva-form-validation](skills/cureva-form-validation/SKILL.md) | Build or fix React Hook Form and Zod validation, including language-dependent errors and numeric/date boundaries. |
| [cureva-localized-exports](skills/cureva-localized-exports/SKILL.md) | Create or repair patient/practitioner exports and report formatting with translated labels, RTL, and correct data. |
| [cureva-realtime-sync](skills/cureva-realtime-sync/SKILL.md) | Implement or debug clinic-scoped Socket.IO events and their effects on query caches and notifications. |
| [cureva-api-contracts](skills/cureva-api-contracts/SKILL.md) | Add or change a Nest endpoint and keep Prisma, shared types, services, hooks, and callers consistent. |
| [cureva-accessible-ui](skills/cureva-accessible-ui/SKILL.md) | Review or repair keyboard, focus, accessible names, and RTL interaction in Cureva UI components. |
| [cureva-performance](skills/cureva-performance/SKILL.md) | Investigate a demonstrated slow page, expensive query, repeated render, or excess network request in Cureva. |
| [cureva-regression-tests](skills/cureva-regression-tests/SKILL.md) | Design focused regression tests for a demonstrated Cureva bug or risky behavior change. |
| [cureva-dependency-upgrades](skills/cureva-dependency-upgrades/SKILL.md) | Evaluate or apply an explicitly requested dependency upgrade for the web, API, or shared packages. |
| [cureva-runtime-debugging](skills/cureva-runtime-debugging/SKILL.md) | Verify a running Cureva page or diagnose Next/Nest development runtime and generated-cache failures. |
| [cureva-database-maintenance](skills/cureva-database-maintenance/SKILL.md) | Perform explicitly requested seed, reset, cleanup, or database repair with the exact target and scope established. |
| [cureva-change-review](skills/cureva-change-review/SKILL.md) | Review a requested Cureva diff for actionable correctness, security, regression, and contract defects. |
| [cureva-agent-maintenance](skills/cureva-agent-maintenance/SKILL.md) | Maintain Cureva AGENTS.md, Cursor rules, and project skills without creating conflicting or redundant instructions. |

## Checks and editor tasks

From the repository root, run `rtk proxy node scripts/check-agent-assets.cjs` and `rtk proxy node scripts/check-i18n.cjs`. The first checks structure and local links; it cannot prove agent quality. The second checks dictionary shape, interpolation placeholders, and representative locale behavior; it does not replace browser verification.

The matching tasks are in [VS Code/Cursor tasks](../.vscode/tasks.json). They do not start servers, connect to a database, install packages, or change permissions. Existing settings are preserved.
