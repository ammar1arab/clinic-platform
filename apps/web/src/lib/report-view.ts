import { ENDPOINTS } from '@/constants/endpoints';
import { ROUTES } from '@/constants/routes';

export type ReportViewKey =
  | 'patientMedical'
  | 'patientsDirectory'
  | 'practitionersDirectory'
  | 'practitionerProfile'
  | 'practitionerAppointments'
  | 'practitionerHours'
  | 'practitionerExceptions'
  | 'clinicAppointments'
  | 'referrals'
  | 'finance'
  | 'signedVisits'
  | 'issuedInvoices';

export type ReportViewRequest = {
  key: ReportViewKey;
  patientId?: string;
  practitionerId?: string;
  from?: string;
  to?: string;
  status?: string;
};

const VIEW_KEYS = new Set<string>([
  'patientMedical', 'patientsDirectory', 'practitionersDirectory', 'practitionerProfile',
  'practitionerAppointments', 'practitionerHours', 'practitionerExceptions',
  'clinicAppointments', 'referrals', 'finance', 'signedVisits', 'issuedInvoices',
]);

const R = ENDPOINTS.REPORTS;

// Each report maps to the same endpoint its download uses, asked for as JSON.
function endpointFor({ key, patientId = '', practitionerId = '', from, to, status }: ReportViewRequest): { path: string; query: Record<string, string | undefined> } {
  const dates = { from, to };
  switch (key) {
    case 'patientMedical': return { path: R.PATIENT_MEDICAL(patientId), query: {} };
    case 'patientsDirectory': return { path: R.PATIENTS_DIRECTORY, query: { status: 'active' } };
    case 'practitionersDirectory': return { path: R.PRACTITIONERS_DIRECTORY, query: {} };
    case 'practitionerProfile': return { path: R.PRACTITIONER_PROFILE(practitionerId), query: {} };
    case 'practitionerAppointments': return { path: R.PRACTITIONER_APPOINTMENTS(practitionerId), query: dates };
    case 'practitionerHours': return { path: R.PRACTITIONER_HOURS(practitionerId), query: dates };
    case 'practitionerExceptions': return { path: R.PRACTITIONER_EXCEPTIONS(practitionerId), query: dates };
    case 'clinicAppointments': return { path: R.APPOINTMENTS, query: { ...dates, status } };
    case 'referrals': return { path: R.REFERRALS, query: { ...dates, patientId } };
    case 'finance': return { path: R.FINANCE, query: dates };
    case 'signedVisits': return { path: R.VISITS, query: { ...dates, reportStatus: 'signed' } };
    case 'issuedInvoices': return { path: R.VISITS, query: { ...dates, invoiceStatus: 'issued' } };
  }
}

function toQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([name, value]) => {
    if (value) query.set(name, value);
  });
  return query.toString();
}

export function reportViewPath(request: ReportViewRequest, clinicId: string) {
  const { path, query } = endpointFor(request);
  return `${path}?${toQuery({ ...query, clinicId, format: 'json' })}`;
}

export function reportViewHref(request: ReportViewRequest) {
  return `${ROUTES.REPORTS_VIEW}?${toQuery({ ...request })}`;
}

export function parseReportViewRequest(params: URLSearchParams): ReportViewRequest | null {
  const key = params.get('key');
  if (!key || !VIEW_KEYS.has(key)) return null;
  return {
    key: key as ReportViewKey,
    patientId: params.get('patientId') ?? undefined,
    practitionerId: params.get('practitionerId') ?? undefined,
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
    status: params.get('status') ?? undefined,
  };
}
