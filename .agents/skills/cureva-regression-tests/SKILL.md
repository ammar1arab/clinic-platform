---
name: cureva-regression-tests
description: "Design focused regression tests for a demonstrated Cureva bug or risky behavior change."
---

# Regression Tests

Find existing tests and package scripts first. Appointments already has service tests; do not assume every package has an e2e suite. Choose the lowest layer that can observe the failure: pure helper, service, integration, or UI.

Write a test that fails for the old behavior and passes for the fix. For locale work, reuse an imported schema across language changes. For tenant work, use a foreign clinic ID. For money/booking work, test the boundary or repeat request that caused the defect. Use synthetic data and deterministic clocks where time matters.

Do not assert implementation wording, internal call counts, or snapshots when the user-visible contract can be asserted directly. Avoid production databases and external side effects. Run the focused test once, broaden only for a concrete risk, and report skipped gates separately from passes.
