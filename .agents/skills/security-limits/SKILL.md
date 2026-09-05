---
name: security-limits
description: "Implement shared rate limits for authentication or another explicitly requested security boundary."
---

Read [the project profile](../../project.md) first.

Read the project profile to identify existing storage and proxy settings. Bound attempts by both network identity and the protected resource where needed. Use atomic shared storage for multiple instances; define expiry and cleanup. Avoid plaintext emails/IPs in storage keys. Return actionable retry metadata without disclosing account existence. Test concurrent requests and storage failures; do not add Redis when the installed transactional store meets the workload.
