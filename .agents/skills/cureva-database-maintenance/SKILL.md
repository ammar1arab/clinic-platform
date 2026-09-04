---
name: cureva-database-maintenance
description: "Perform explicitly requested seed, reset, cleanup, or database repair with the exact target and scope established."
---

# Database Maintenance

Inspect the configured connection target without printing credentials. A localhost web app may use hosted Supabase; distinguish app location from database location. State the target and affected schemas/tables before destructive execution unless already confirmed in this session. Existing authorization applies to the same scope; do not ask again after it is clear.

Use a transaction where possible, bounded connection/query/lock timeouts, and an operation that preserves the requested schema/migration history. Do not casually CASCADE into auth, storage, or unrelated schemas. For one owner account, create the minimal Clinic/User/ClinicUser records rather than the full demo seed.

After a timeout, cancellation, or disconnect, read the postcondition before retrying. Report success only after commit and verification. Keep database secrets and login credentials out of reusable skills and memory. This skill is not standing authorization for future destructive operations.
