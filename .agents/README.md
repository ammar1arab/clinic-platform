# Agent skills and rules

Start with [project context](project.md) and the [rule index](rules/project-rules.md).
The core active skills live in [.agents/skills](skills).
To optimize performance, less frequently used skills have been moved to `.agents/archive-skills/`.

Active core skills:
- [Full-stack feature](skills/clinic-feature/SKILL.md)
- [Translations](skills/sync-i18n/SKILL.md)
- [Theme UI](skills/theme-ui/SKILL.md)
- [API Contracts](skills/cureva-api-contracts/SKILL.md)
- [Form Validation](skills/cureva-form-validation/SKILL.md)
- [Change Review](skills/cureva-change-review/SKILL.md)

If you need a specialized skill (e.g. for auth-challenges or hydration), move its folder from `.agents/archive-skills/` back to `.agents/skills/`.

## Use with another agent or editor

The root AGENTS.md is the general entry point. CLAUDE.md, .cursor/rules, and .github/copilot-instructions.md point at the same canonical source. Automatic discovery depends on the host.

## Reuse in another project

Copy .agents and the entry/adaptor files. Update [project.md](project.md), then review domain rules and Cureva-specific skills for applicability. Generic skills can be copied from the archive if needed.

Keep secrets, real patient data, and temporary permissions out of these files.
Run `npm run check-agent-assets` (or node script) for structure and link validation.
See [durable decisions](memory/project-context.md) for project-specific history.
