---
name: cureva-appointment-engine
description: "Change appointment scheduling, availability, queue transitions, or rescheduling with domain invariants intact."
---

# Appointment Engine

Trace appointments.service.ts, appointments.repository.ts, their existing tests, practitioner availability/time-off models, and the consuming hooks. Use the current AppointmentStatus enum; do not invent transitions from UI labels.

Establish clinic timezone, duration, buffer, practitioner, room, and session type before evaluating a slot. Distinguish a date-only value, local wall-clock time, and an instant. Check overlap at boundaries, time off, room occupancy, and the edited appointment's own ID. In-person and online requirements must agree between form validation and the API.

For concurrent booking risks, enforce the invariant at the transaction/database boundary instead of relying solely on a stale availability response. Preserve billing and queue side effects when status changes. Extend existing appointment tests for the actual edge case, and exercise one normal booking or reschedule after the fix.
