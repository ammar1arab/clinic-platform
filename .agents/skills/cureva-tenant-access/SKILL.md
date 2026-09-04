---
name: cureva-tenant-access
description: "Review or implement clinic isolation and role authorization for Cureva endpoints and related UI."
---

# Tenant Access

Read the existing JWT strategy, auth-user type, role decorators/guards, and the target repository. Roles are owner, admin, practitioner, and financial. Derive authorization from the authenticated identity; a clinicId or record ID supplied by the browser is not sufficient authority.

Check list, detail, update, delete, bulk, report, and socket paths involved in the change. Scope related IDs too: a practitioner or patient from another clinic must not be attached through a valid parent record. Keep authorization on the server even when the UI hides a control. Inspect actual owner/practitioner rules before deciding a new permission.

Use synthetic fixtures for at least one allowed role, one denied role, and a cross-clinic ID. Verify no sensitive data is returned before denial. Do not broaden the task into a full security audit unless requested. Reference: [Nest authorization](https://docs.nestjs.com/security/authorization).
