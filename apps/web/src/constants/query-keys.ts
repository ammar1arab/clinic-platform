export const QUERY_KEYS = {
  emails: {
    all: ['emails'] as const,
    history: (clinicId: string, lang: string, filters: object) => ['emails', clinicId, lang, 'history', filters] as const,
    detail: (clinicId: string, lang: string, id: string, page: number, brandStamp = '') =>
      ['emails', clinicId, lang, 'detail', id, page, brandStamp] as const,
    settings: (clinicId: string) => ['emails', clinicId, 'settings'] as const,
    audiences: (clinicId: string) => ['emails', clinicId, 'audiences'] as const,
    variables: (clinicId: string) => ['emails', clinicId, 'variables'] as const,
    recipients: (clinicId: string, selection: object) => ['emails', clinicId, 'recipients', selection] as const,
    preview: (clinicId: string, input: object, brandStamp = '') =>
      ['emails', clinicId, 'preview', brandStamp, input] as const,
  },
  departments: {
    all: ['departments'] as const,
    list: (clinicId: string) => ['departments', clinicId] as const,
  },
  rooms: {
    all: ['rooms'] as const,
    list: (clinicId: string) => ['rooms', clinicId] as const,
  },
  services: {
    all: ['services'] as const,
    list: (clinicId: string) => ['services', clinicId] as const,
  },
  practitioners: {
    requests: (clinicId: string, doctorId?: string, group = 'pending', page = 1) => ['practitioners', 'schedule-requests', clinicId, doctorId ?? null, group, page] as const,
    all: ['practitioners'] as const,
    list: (clinicId: string) => ['practitioners', clinicId] as const,
    directory: (filters: object) => ['practitioners', 'directory', filters] as const,
    detail: (id: string) => ['practitioners', 'detail', id] as const,
  },
  paymentMethods: {
    all: ['payment-methods'] as const,
    list: (clinicId: string) => ['payment-methods', clinicId] as const,
  },
  packages: {
    all: ['packages'] as const,
    list: (clinicId: string) => ['packages', clinicId] as const,
  },
  patientPackages: {
    all: ['patient-packages'] as const,
    list: (patientId: string) => ['patient-packages', patientId] as const,
    summary: (patientId: string, excludeAppointmentId?: string) =>
      ['patient-packages', 'summary', patientId, excludeAppointmentId ?? null] as const,
  },
  discountCodes: {
    all: ['discount-codes'] as const,
    list: (clinicId: string) => ['discount-codes', clinicId] as const,
  },
  clinics: {
    detail: (clinicId: string) => ['clinic', clinicId] as const,
    staff: (clinicId: string) => ['clinic-staff', clinicId] as const,
  },
  patients: {
    all: ['patients'] as const,
    list: (filters: object) => ['patients', filters] as const,
    detail: (id: string) => ['patients', 'detail', id] as const,
  },
  visits: {
    all: ['visits'] as const,
    list: (filters: object) => ['visits', 'list', filters] as const,
    workspace: (appointmentId: string) => ['visits', 'workspace', appointmentId] as const,
    history: (visitId: string) => ['visits', 'history', visitId] as const,
  },
  clinicalNoteTemplates: {
    all: ['clinical-note-templates'] as const,
    list: ['clinical-note-templates', 'list'] as const,
    detail: (id: string) => ['clinical-note-templates', id] as const,
    available: (appointmentId: string) => ['clinical-note-templates', 'available', appointmentId] as const,
  },
  notePreference: ['note-preference'] as const,
  notificationPrefs: ['notification-prefs'] as const,
  notifications: ['notifications'] as const,
  appointments: {
    all: ['appointments'] as const,
    list: (filters: object) => ['appointments', filters] as const,
    detail: (id: string) => ['appointments', 'detail', id] as const,
  },
  referrals: {
    all: ['referrals'] as const,
    list: (filters: object) => ['referrals', filters] as const,
  },
  weather: (zone: string, lang: string) => ['local-weather', zone, lang] as const,
  dashboard: {
    kpisAll: ['dashboard-kpis'] as const,
    kpis: (clinicId: string, practitionerId?: string) => ['dashboard-kpis', clinicId, practitionerId ?? null] as const,
    roomUtilizationAll: ['room-utilization'] as const,
    roomUtilization: (clinicId: string, practitionerId?: string) => ['room-utilization', clinicId, practitionerId ?? null] as const,
  },
} as const;
