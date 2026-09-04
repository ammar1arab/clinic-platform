---
name: cureva-agent-maintenance
description: "Maintain Cureva AGENTS.md, Cursor rules, and project skills without creating conflicting or redundant instructions."
---

# Agent Maintenance

Start at AGENTS.md and .agents/README.md. Canonical project rules are in .cursor/rules; new portable skills are in .agents/skills, with the five legacy skills still in .cursor/skills. Change the source once and update links, not copied rule bodies.

Keep always-loaded guidance short. A skill needs a precise trigger, concrete repository entry points, decisions that matter, and a meaningful completion check. Do not add a skill just to reach a number or copy a generic tutorial. Retain user intent, available-tool boundaries, and authorization scope. Never store passwords, API keys, patient records, or blanket destructive approval as memory.

Verify current official documentation before adding host-specific settings. Do not invent config fields or force a model. Run scripts/check-agent-assets.cjs after changes, check local links, and inspect ambiguous triggers. Document additions in the catalog so developers can discover and invoke them.
