---
name: cureva-runtime-debugging
description: "Verify a running Cureva page or diagnose Next/Nest development runtime and generated-cache failures."
---

# Runtime Debugging

Read .agents/rules/ironbee-devtools-use.md before browser work. Use IronBee when its browser tools are available. If absent, do not substitute another browser tool in conflict with that rule; continue with allowed static or pure-runtime checks and disclose the missing browser verification.

Identify listeners and their working directories before starting or stopping a server. Never kill every node process. Reuse user-owned dev servers and stop only processes started for the task unless the user directs otherwise. Track any temporary port.

For malformed .next generated files, identify duplicate dev processes or interrupted generation. Do not patch generated validator code by hand. A source-only typecheck can isolate application errors, but cannot be reported as a full Next build. After an authorized cache regeneration or restart, verify the original route, action, and console output.
