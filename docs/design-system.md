# Cureva color roles

All theme values live in `apps/web/src/app/globals.css`. Components use semantic utilities; clinic branding changes `primary`, not the meaning of operational states.

| Token | Meaning |
| --- | --- |
| `primary` | Clinic identity, selected navigation, primary actions |
| `foreground`, `muted-foreground`, `border`, `background`, `card` | Shared neutral text, borders and surfaces |
| `info` | Information and sessions in progress |
| `success` | Confirmed/successful/completed operations |
| `warning` | Waiting, pending review, attention required |
| `error` / `destructive` | Errors, destructive actions, unsuccessful outcomes |
| `accent-teal` | Scheduling and care navigation accents |
| `accent-violet` | Templates and organizational navigation accents |

Use `IconWell` for icon containers and `Badge` for state labels. Their light/dark appearances read the same CSS tokens. Existing indigo/cyan/orange/pink icon accents remain compatibility aliases to this palette; they do not introduce additional colors. Inactive sidebar icons remain neutral; selected navigation uses the clinic color.

Appointment badges, dots and calendar colors are defined together in `constants/appointment.ts`. Completed is success, in-progress is info, waiting is warning, cancelled is neutral, and no-show is destructive. Do not infer clinical meaning from decorative navigation colors.
