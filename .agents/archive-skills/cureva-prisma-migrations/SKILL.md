---
name: cureva-prisma-migrations
description: "Design and verify a Prisma schema or migration change for the clinic database."
---

# Prisma Migrations

Read apps/api/prisma/schema.prisma, prisma.config.ts, existing migration history, and the affected service/repository. Inspect the installed Prisma version and local CLI help before selecting commands; this project uses a PostgreSQL adapter and separate runtime/direct connection variables.

Describe whether the change is additive, requires a backfill, changes nullability, or removes data. Prefer expand/backfill/contract for populated columns. Keep database constraints, shared DTOs, and application checks consistent. Generate and review SQL in an authorized development environment; do not use reset or db push as a substitute for a reviewed migration on hosted data.

Check foreign keys, unique indexes, clinic scoping, and rollback or forward-repair strategy. Applying to a hosted target requires the user's authorization for that target. Validate existing rows as well as new writes. Do not publish connection strings or make network calls just to inspect the schema.
