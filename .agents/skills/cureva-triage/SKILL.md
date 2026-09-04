---
name: cureva-triage
description: "Trace a Cureva bug from its visible symptom to the responsible web, API, or database layer before changing code."
---

# Triage

Start with the failing route, action, expected result, and actual response or stack frame. Read the smallest implicated call chain. For a web error, trace block -> hooks/api -> services -> Nest controller and service only as far as the evidence requires.

Check the working diff before editing; this repository may contain unrelated work. Distinguish a missing account, failed request, stale cache, and rendering mismatch instead of treating every symptom as a UI bug. Prefer one testable hypothesis and one decisive check. Use existing logs without printing tokens or patient payloads.

Fix the earliest incorrect state, then exercise the original trigger. If a tool or dependency is unavailable, state that limitation and perform independent checks that remain possible. Report the cause, smallest change, and evidence; do not claim a runtime pass from compilation alone.
