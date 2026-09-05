# Efficient work

- Read AGENTS.md, the matching rules, and at most the skills needed for the task. Do not load the complete catalog into context.
- Use rtk for shell commands; use rtk proxy for unsupported commands. If unavailable, report it once and use the underlying command. Start searches with rg and a relevant path. Batch independent reads; serialize edits and dependent operations.
- Inspect the working diff before edits. Preserve unrelated work. Stop and investigate unexpected concurrent changes to a target instead of overwriting them.
- Continue authorized work. Ask only for a material missing requirement or an unapproved consequential action. Do not repeatedly ask for the same confirmed scope. Skill selection itself is not an approval gate.
- Validate the behavior affected by the change. Do not run every test for a text-only change or equate a source check with a full runtime pass. Stop optional testing when the relevant risk is covered.
- Report cause, result, verification, and material limitations. Never claim a write succeeded before checking its postcondition.
- No automatic delegation, model changes, new tasks, commits, pushes, deploys, or outbound messages merely because a skill suggests them. Follow the user's request and the current host's capabilities.
- Permanent memory is versioned project guidance. Never save credentials, patient data, or one-time destructive authorization there.
