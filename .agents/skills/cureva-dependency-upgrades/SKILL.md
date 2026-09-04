---
name: cureva-dependency-upgrades
description: "Evaluate or apply an explicitly requested dependency upgrade for the web, API, or shared packages."
---

# Dependency Upgrades

Read the relevant package.json, lockfile, runtime version, and official release/migration notes. A September 2026 review date is not permission to replace installed versions with whatever is newest. Identify direct and peer dependency constraints across React/Next, Prisma/client/adapter, Nest, and shared file dependencies.

Prefer the smallest compatible change. Run installs from the package that owns its lockfile; preserve unrelated dependency changes. Review postinstall effects before executing them. Do not bypass certificate checks, integrity checks, or peer dependency errors to force an upgrade.

Verify the affected build/typecheck and a meaningful runtime flow. Record the exact before/after versions, breaking changes addressed, and unresolved advisories. A read-only recommendation should not modify dependencies. Reference official sources at the time of work rather than encoding transient version numbers in permanent rules.
