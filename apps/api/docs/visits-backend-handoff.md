# Visits backend handoff to Cursor

The backend and shared contracts are implemented in `packages/types/visit.ts` and exported from `@clinic/types`. Use those types, not the provisional DTOs in the briefing. `apps/web` belongs to the frontend agent and was not edited in this backend task.

## Deployment prerequisite and verification boundary

Update (2026-10-18): after explicit user authorization, the visits migration was successfully applied to the configured Supabase development database using `prisma migrate deploy`. API/shared and web production builds passed. No tests or email sends were run. The original implementation boundary below describes the earlier handoff.

The SQL migration at `prisma/migrations/20261018000100_visits_clinical_documents/migration.sql` has been prepared, NOT applied. It must be reviewed and applied in a safe development database before exercising these endpoints. No live API, email, account creation, production data, migration execution, or tests were used during implementation. Local Prisma client generation and build/type checks are the verification performed.

The migration imports only existing `in_progress` appointments with a recorded `inProgressAt`. It freezes their current appointment/pricing context and marks it `legacyImported`. Existing completed appointments remain historical appointments with `visitId: null`; their real finish times and clinical notes are unknown and are not invented. Never show Start/Finish/new-note actions for them. Existing administrative `Appointment.notes` is not converted to clinical documentation.

## Authentication, isolation, capabilities

All routes require the current authenticated session. Clinic scope comes from `AuthUser`, never a posted clinic ID. Practitioner appointment/workspace reads are constrained to their own `clinicUserId`.

Use `VisitWorkspace.allowedActions` for all actions. Owner can reopen/revoke notes and manage invoices/documents but cannot write/sign notes or reports. A practitioner can author their own note/report, view their own invoice, and flag a discrepancy. Admin/financial currently have scoped operational/invoice read access only; no clinical draft values are returned. Owner receives signed report content, not internal note contents. No patient login or pretend financial accounts were added.

## Response and revision rules

- `GET /visits` returns **VisitListResponse**, not a bare array: `{items,total,page,limit,serverNow}`. Filters: `from,to,practitionerId,appointmentStatus,noteStatus,reportStatus,invoiceStatus,search,page,limit` (limit <= 100). Dates should be full ISO UTC instants; display with workspace `clinicTimezone`.
- Each item is `VisitSummary`, including appointmentRevision and nullable visitId/start/finish/deadline.
- `GET /appointments/:appointmentId/workspace` returns **VisitWorkspace**. It also supplies serverNow, visitRevision, safe meetingUrl, room, patientContext, documentationUnlock, note/report/invoice, allowedActions.
- The note, report and invoice each have their **own revision**. Never substitute visitRevision for one of those revisions.
- Start body is `{expectedAppointmentRevision?}`. Finish body is `{expectedRevision: workspace.visitRevision}`. Sign bodies use `{revision: document.revision}`.
- Conflict => HTTP 409, `code: visitRevisionConflict`. Preserve local unsaved text, reload current server state, and offer explicit recovery. Never automatically overwrite a newer draft.
- A locked note produces HTTP 423 `clinicalNoteLocked`, even on a page opened before the deadline. The deadline is frozen at scheduled end + 48 hours. Owner reopening has no expiry and ends on sign/revoke.
- Server errors include a stable code and localized EN/AR message. `VISIT_ERROR_MESSAGES` and `VisitErrorCode` are exported for the frontend translation layer.

## Appointment and visit commands

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| GET | /visits | query filters above | VisitListResponse |
| GET | /appointments/:appointmentId/workspace | - | VisitWorkspace |
| POST | /appointments/:appointmentId/check-in | `{source: 'front_desk'|'practitioner'|'online_manual'}` | VisitWorkspace |
| POST | /appointments/:appointmentId/mark-waiting | `{}` | VisitWorkspace |
| POST | /appointments/:appointmentId/visits/start | StartVisitDto / expectedAppointmentRevision | VisitWorkspace |
| POST | /visits/:visitId/finish | RevisionInput / expectedRevision | VisitWorkspace |

Online appointments require an explicit check-in with `source: online_manual` before mark-waiting/start. A safe HTTPS meeting URL is returned only to authorized roles. Opening it does not confirm presence and does not start a visit. In-person arrival uses front_desk/practitioner. Only the assigned practitioner starts/finishes. Repeating successful Start/Finish is safe and returns current state.

PATCH appointment.status may no longer check-in/start/finish a consultation. Use the commands above in Home/Calendar/Queue. Started appointment schedule, assignment, pricing and mode cannot be silently changed through PATCH. Such administrative changes remain blocked rather than mutating an already-frozen clinical record. Old appointment payment/package endpoints reject started visits; use invoice commands.

## Clinical templates and preference

| Method | Path | Body / response |
| --- | --- | --- |
| GET | /clinical-note-templates | owner catalog -> TemplateDTO[] |
| GET | /clinical-note-templates/starter | owner -> ClinicalTemplateInput (headings/empty fields only) |
| POST | /clinical-note-templates | ClinicalTemplateInput -> TemplateDTO |
| GET | /clinical-note-templates/:id | owner -> TemplateDTO |
| PATCH | /clinical-note-templates/:id | complete ClinicalTemplateInput plus `{revision}` -> TemplateDTO |
| POST | /clinical-note-templates/:id/publish | `{revision}` -> TemplateDTO with publishedVersionId |
| POST | /clinical-note-templates/:id/archive | `{revision}` -> TemplateDTO |
| POST | /clinical-note-templates/:id/clone | `{}` -> new draft TemplateDTO |
| GET | /clinical-note-templates/:id/versions | owner -> TemplateVersionDTO[] |
| GET | /clinical-note-templates/available?appointmentId=... | allowed published templates for this appointment |
| GET | /clinical-note-templates/available | practitioner's allowed preference choices |
| GET / PUT | /practitioners/me/note-preference | NotePreference `{templateId: string|null}` |

Supported field types: text, textarea, number, select, multi_select, boolean, date, measurement. Schema shape is ClinicalSection/ClinicalField. Stable field IDs are unique across the template. Options use `{value,label,labelAr?}`. Measurement value is `{value:number,unit:string}`. Dates are YYYY-MM-DD. Min/max apply to numeric values. Conditional visibility is a single equals/not_equals rule against a different, nonconditional scalar field. No scripts, HTML execution, files or arbitrary formulas. A template has <=30 sections, <=300 total fields and bounded options/text.

Assignments match any selected practitioner/department/service, unless availableToAll is explicitly true. Published versions are immutable. Updating the catalog draft does not mutate a published version or old notes. Archive removes it from new selections; existing drafts keep their snapshot. The frontend may warn about an older version, but must not silently replace it.

## Note and medical report

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| PUT | /visits/:visitId/note/draft | NoteDraftInput `{templateVersionId, values, revision, acknowledgeTemplateChange?}` | VisitWorkspace |
| POST | /visits/:visitId/note/sign | `{revision}` | VisitWorkspace |
| POST | /visits/:visitId/note/addenda | `{text,reason}` | VisitWorkspace |
| GET | /visits/:visitId/note/history?page=1&limit=20 | - | VisitHistoryResponse |
| POST | /visits/:visitId/note/unlock | `{reason}` | VisitWorkspace, owner only |
| POST | /visits/:visitId/note/revoke-unlock | `{reason}` | VisitWorkspace, owner only |
| GET | /visits/:visitId/medical-report | - | VisitReportDTO; pending -> 409 |
| PUT | /visits/:visitId/medical-report/draft | ReportDraftInput `{sections,revision}` | VisitReportDTO |
| POST | /visits/:visitId/medical-report/sign | `{revision}` | VisitReportDTO |
| POST | /visits/:visitId/medical-report/amend | `{sections,revision,reason}` | new signed VisitReportDTO version |
| GET | /visits/:visitId/medical-report/pdf?revision=... | optional signed document revision | authenticated PDF bytes |

First note draft uses revision 0. Values are keyed by field ID. Template selection uses the immutable **publishedVersionId**, not template.id. Replacing an existing draft's version requires explicit acknowledgeTemplateChange; the previous revision is kept in history. Note signing requires the session to be finished and all visible required fields to be valid. Signed note content is immutable; addenda retain the original.

Signing a note prepares report sections `reason,summary,assessment,plan,followUp` from matching signed field IDs when present. Missing sections remain empty, never fabricated. The practitioner must complete/review the reason, summary and plan before signing. Report amendments create new signed documents without replacing old PDFs. Versions are in VisitReportDTO. PDF download must use the existing credentialed service/blob download pattern, not blind window.open.

## Invoice and payment

Finish prepares an invoice from the frozen appointment price, discount, package credit and prepayment. Money is exact decimal strings with three fractional digits (currency JOD). quantity and unitPrice are also decimal strings.

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| GET | /visits/:visitId/invoice | - | InvoiceDTO; before preparation -> 409 |
| PUT | /visits/:visitId/invoice/draft | InvoiceDraftInput `{lineItems,discount?,tax?,revision}` | InvoiceDTO |
| POST | /visits/:visitId/invoice/feedback | `{message}` | InvoiceDTO, own practitioner |
| POST | /visits/:visitId/invoice/feedback/:feedbackId/resolve | `{reason}` | InvoiceDTO, owner |
| POST | /visits/:visitId/invoice/issue | `{revision}` | issued InvoiceDTO |
| POST | /visits/:visitId/invoice/correct | InvoiceCorrectionInput `{lineItems,discount?,tax?,revision,reason}` | documented corrected InvoiceDTO |
| POST | /visits/:visitId/invoice/void | `{revision,reason}` | void InvoiceDTO |
| POST | /invoices/:invoiceId/payments | VisitPaymentInput `{amount,methodId,reference?,reason?,requestId,expectedRevision}` | InvoiceDTO |
| POST | /invoices/:invoiceId/reversals | VisitReversalInput `{paymentId,amount,reason,requestId,expectedRevision}` | InvoiceDTO |
| GET | /visits/:visitId/invoice/pdf?revision=... | optional immutable document revision | authenticated PDF bytes |
| POST | /visit-documents/:documentId/release | `{released:boolean,reason}` | VisitWorkspace, owner |

Line input is `{id,description,quantity,unitPrice}`; total is server calculated. Empty/negative/duplicate items and overpayments are rejected. New invoice edits cannot reduce total below money already paid: record an appropriate reversal first. A prepayment appears as a ledger entry whose ID is invoice.id, and can be reversed with that paymentId. Reversals are append-only negative payment entries and cannot exceed the unreversed source payment.

Preserve one UUID requestId AND the exact body when retrying a payment/reversal. Reusing the ID with a changed body returns visitIdempotencyConflict. All invoice/payment writes are owner-only today. A correction requires a reason, records the previous financial snapshot, and adds a new PDF/number version. Voiding requires all payments/prepayment to have been reversed. Previous PDFs remain available to authorized staff. Superseded/void invoice releases are revoked; release of a current signed document is explicit. No patient access route exists yet.

Invoice status and paymentStatus are separate. Use server paid/balance values. Existing clinic-wide financial exports are preserved; they are still appointment-based and must not be presented as an invoice-ledger export. Per-visit invoice PDFs are the authoritative new documents.

## Realtime, reminders and frontend invalidation

Writes emit the existing `appointment-changed` event and new `visit-changed` in the current clinic room. Invalidate visits/workspace, relevant appointments/queue/home/patient/report/billing queries; add a visit-changed subscription through the existing realtime owner. Never duplicate note/report editors inside entry screens.

Documentation reminders run once per minute in a bounded worker, with persisted event deduplication. They notify the assigned practitioner and active owners an hour before expiry and when locked. Payload contains visitId, appointmentId and deadline, with bilingual title information. Set VISIT_REMINDERS_ENABLED=false to disable the reminder worker locally. The worker never defines the lock: all draft/sign commands independently enforce the frozen deadline in the server transaction.

## Remaining integration work outside backend ownership

- Cursor must wire services -> hooks -> blocks -> routes, menus, workspace links/actions, timer, autosave/recovery, templates, billing and downloads.
- Apply/review the prepared migration in a safe development environment, then perform the agreed authenticated owner/practitioner flow verification. This has NOT been done by this backend task.
- Verify PDF Arabic ordering/typography in actual generated documents and the target viewers. An embedded DejaVu font and license are bundled; PDFs were not generated against clinical data here.
- Existing completed legacy appointments have no new visit/documentation record. Do not manufacture medical facts or finish timestamps.

## Integration details to check against the in-progress frontend

- Note history is paginated VisitHistoryResponse, not VisitAuditEvent[].
- Workspace patientContext uses allergies and bloodType, not a generic notes property.
- Invoice feedback entries are InvoiceFeedbackDTO with message and resolution fields, not raw audit snapshots.
- InvoiceDTO includes immutable document versions. allowedActions includes reversePayment, correctInvoice, voidInvoice, resolveInvoiceFeedback and releaseDocument.
- The detail report/invoice GET endpoints return the ready DTO or a localized 409; nullable pending states live in the workspace object.
- Available template responses always describe published snapshots, even while the owner is editing a newer catalog draft.

- GET /visits also accepts `queue`: not_started, in_progress, documentation_pending, locked, report_pending, invoice_review, completed. Use these server predicates for queue cards and tabs instead of filtering a paginated page in the browser. `total` with limit=1 can populate a queue count. Completed is signed note/report for a practitioner; operational roles additionally require an issued invoice. `documentation_pending` excludes legacy completed appointments with no actual visit.
