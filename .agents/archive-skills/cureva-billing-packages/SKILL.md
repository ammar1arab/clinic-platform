---
name: cureva-billing-packages
description: "Change fees, discounts, payment status, session packages, or credit redemption in Cureva."
---

# Billing Packages

Inspect modules/appointments/payable.ts, patient-packages services/repositories, shared DTOs, and lib/package-balance.ts. Confirm the actual calculation order and rounding convention from code before editing. JOD presentation currently uses three decimal places; formatting is separate from monetary arithmetic.

Preserve decimal precision on the server. Check fixed versus percentage discounts, zero payable amounts, package exhaustion, expired/inactive packages, and release/redeem reversals. A retry must not consume a second session or deduct credit twice. Keep balance updates and appointment coverage consistent inside the appropriate transaction.

Verify a normal charge, boundary amount, rejected overdraw, and repeat request when those paths change. Invalidate appointment, billing summary, and aggregate views affected by the write. Translate complete balance and success-message templates; avoid assembling Arabic grammar from English fragments.
