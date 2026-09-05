# Agent skills and rules

Start with [project context](project.md) and the [rule index](rules/project-rules.md).
All skills now live in [.agents/skills](skills), each in a folder with a SKILL.md entry point.
The existing 20 Cureva skills and five migrated feature/theme/workflow skills remain available.

Auth-related skills:
- [Auth sessions](skills/cureva-auth-sessions/SKILL.md)
- [Auth challenges](skills/auth-challenges/SKILL.md)
- [Security limits](skills/security-limits/SKILL.md)
- [Accessible feedback](skills/accessible-feedback/SKILL.md)
- [Portable agent guidance](skills/portable-agent-guidance/SKILL.md)
- [Full-stack feature](skills/clinic-feature/SKILL.md)
- [Translations](skills/sync-i18n/SKILL.md)

Other domain skills remain discoverable by reading SKILL.md frontmatter under skills.
Only load matching skills, never the complete catalog for a routine task.

## Use with another agent or editor

The root AGENTS.md is the general entry point. CLAUDE.md, .cursor/rules, .github/copilot-instructions.md, and .agent/rules/project.md point at the same canonical source. Automatic discovery depends on the host; when it does not discover them, explicitly tell it to read AGENTS.md. No adapter can guarantee that every agent obeys instructions.

## Reuse in another project

Copy .agents and the entry/adaptor files. Update [project.md](project.md), then review domain rules and Cureva-specific skills for applicability. Generic skills such as auth-challenges, security-limits, accessible-feedback, and portable-agent-guidance route through the project profile. Clinic scheduling and billing skills deliberately retain their domain rules and should only be copied when relevant.

Keep secrets, real patient data, and temporary permissions out of these files.
Run `rtk proxy node scripts/check-agent-assets.cjs` for structure and link validation.
See [durable decisions](memory/project-context.md) for project-specific history.
