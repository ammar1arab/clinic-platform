# @clinic/types

Shared **HTTP contract** types for `apps/web` and `apps/api`.

## Layout

| File | Contents |
|------|----------|
| `enums.ts` | Role, status, session, discount, report, referral enums |
| `auth.ts` | AuthMe, Clinic, ClinicStaffMember, UpdateClinicInput |
| `patient.ts` | Patient, PatientDetail, create/update/filters |
| `appointment.ts` | Appointment + create/update/filters |
| `billing.ts` | Payment methods, packages, discount codes |
| `catalog.ts` | Departments, rooms, services |
| `referral.ts` | Referrals |
| `dashboard.ts` | KPIs / room utilization |

## Usage

```ts
import type { Patient, Appointment, AuthMe } from '@clinic/types';
```

## Build (required for API)

Nest resolves the built package under `node_modules` (not a TS path into `src`), so:

```bash
cd packages/types && npm run build
cd ../../apps/api && npm install
```

Web can keep using the path alias to `src` for editor DX; API must use the built `dist`.
