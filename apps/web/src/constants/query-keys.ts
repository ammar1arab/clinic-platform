export const QUERY_KEYS = {
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
    all: ['practitioners'] as const,
    list: (clinicId: string) => ['practitioners', clinicId] as const,
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
  appointments: {
    all: ['appointments'] as const,
    list: (filters: object) => ['appointments', filters] as const,
    detail: (id: string) => ['appointments', 'detail', id] as const,
  },
  referrals: {
    all: ['referrals'] as const,
    list: (filters: object) => ['referrals', filters] as const,
  },
  dashboard: {
    kpisAll: ['dashboard-kpis'] as const,
    kpis: (clinicId: string) => ['dashboard-kpis', clinicId] as const,
    roomUtilizationAll: ['room-utilization'] as const,
    roomUtilization: (clinicId: string) => ['room-utilization', clinicId] as const,
  },
} as const;
