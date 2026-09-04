---
name: cureva-change-review
description: "Review a requested Cureva diff for actionable correctness, security, regression, and contract defects."
---

# Change Review

Identify the user's diff or branch and read the relevant instructions. Separate existing working changes from the reviewed change. Follow affected data flow and callers rather than judging a file in isolation.

Prioritize broken behavior, tenant leakage, auth errors, money precision, appointment concurrency, stale translations, SSR mismatch, and missing cache invalidation when those areas are touched. Cite a concrete trigger and narrow file/line evidence for each finding. Do not invent speculative defects or request broad refactors as correctness fixes.

Run a focused check only when it resolves uncertainty. Report findings first with severity and practical impact; say when there are no actionable findings. Distinguish tests run from reasoning and list material verification limits. A review request alone does not authorize committing, publishing, or deploying.
