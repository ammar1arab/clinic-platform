---
name: cureva-change-review
description: "Review a Cureva diff or explicitly requested repository audit for actionable correctness, security, regression, contract, and duplication defects."
---

# Change Review

Identify the user's diff or branch and read the relevant instructions. Separate existing working changes from the reviewed change. Follow affected data flow and callers rather than judging a file in isolation.

Prioritize broken behavior, tenant leakage, auth errors, money precision, appointment concurrency, stale translations, SSR mismatch, and missing cache invalidation when those areas are touched. Cite a concrete trigger and narrow file/line evidence for each finding. Do not invent speculative defects or request broad refactors as correctness fixes.

Run a focused check only when it resolves uncertainty. Report findings first with severity and practical impact; say when there are no actionable findings. Distinguish tests run from reasoning and list material verification limits. A review request alone does not authorize committing, publishing, or deploying.

## Repository audit

When the user requests a whole-repository review, inventory production source, routes, shared contracts, and build commands first. Record reviewed flows and remaining coverage in a report; a source search or passing build is not a complete behavioral audit.

Trace each flow through request validation, authenticated identity, role checks, related record ownership, repository writes, response contracts, query invalidation, and UI states. Include authenticated HTTP, public auth routes, sockets, scheduled workers, and provider webhooks. Check omitted and malformed filters, concurrent writes, retries, stale results, and partial failures.

Validate each finding against callers and existing protections. Give a concrete trigger, impact, file and line evidence, and severity. Separate confirmed defects from open business questions. Deduplicate findings sharing one root cause. Never suppress an existing defect merely because it predates the current diff when auditing the whole repository.

For cleanup, compare repeated code before extracting it. Reuse an existing owner when the behavior is identical; keep domain boundaries when superficially similar code has different authorization or lifecycle rules. Do not consolidate files or introduce a generic CRUD framework just to reduce counts.

Apply authorized fixes in small coherent groups. Preserve existing work and staging. Respect explicit restrictions on tests, emails, database access, migrations, and external actions. Use permitted builds and type checks, then report their limits and unresolved findings honestly.

External references reviewed on 2026-10-15: [OpenAI security review guidance](https://github.com/openai/skills/blob/main/skills/.curated/security-best-practices/SKILL.md) for framework-specific inspection and severity reporting; [Anthropic code review workflow](https://github.com/anthropics/claude-code/blob/main/plugins/code-review/commands/code-review.md) for validating findings and avoiding duplicate or speculative reports. These are references, not authorization to invoke external tools, delegate, publish comments, or override Cureva rules. Do not claim future-year guidance has been verified.
