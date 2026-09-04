export const ENDPOINTS = {
  APPOINTMENTS: {
    BASE: "/appointments",
    BY_ID: (id: string) => `/appointments/${id}`,
    MARK_PAID: (id: string) => `/appointments/${id}/mark-paid`,
    MARK_UNPAID: (id: string) => `/appointments/${id}/mark-unpaid`,
    REDEEM_PACKAGE: (id: string) => `/appointments/${id}/redeem-package`,
    RELEASE_PACKAGE: (id: string) => `/appointments/${id}/release-package`,
  },
  AUTH: {
    ME: "/auth/me",
    LOGIN: "/auth/login",
  },
  CLINICS: {
    BY_ID: (id: string) => `/clinics/${id}`,
    STAFF: (clinicId: string) => `/clinics/${clinicId}/staff`,
  },
  DASHBOARD: {
    KPIS: "/dashboard/kpis",
    ROOM_UTILIZATION: "/dashboard/room-utilization",
  },
  DEPARTMENTS: {
    BASE: "/departments",
    BY_ID: (id: string) => `/departments/${id}`,
    DEACTIVATE: (id: string) => `/departments/${id}/deactivate`,
    REACTIVATE: (id: string) => `/departments/${id}/reactivate`,
  },
  DISCOUNT_CODES: {
    BASE: "/discount-codes",
    BY_ID: (id: string) => `/discount-codes/${id}`,
    DEACTIVATE: (id: string) => `/discount-codes/${id}/deactivate`,
  },
  PACKAGES: {
    BASE: "/packages",
    BY_ID: (id: string) => `/packages/${id}`,
    DEACTIVATE: (id: string) => `/packages/${id}/deactivate`,
  },
  PATIENT_PACKAGES: {
    BASE: "/patient-packages",
    BY_ID: (id: string) => `/patient-packages/${id}`,
    DEACTIVATE: (id: string) => `/patient-packages/${id}/deactivate`,
    SUMMARY: (patientId: string) => `/patient-packages/summary/${patientId}`,
  },
  PATIENTS: {
    BASE: "/patients",
    BY_ID: (id: string) => `/patients/${id}`,
    DEACTIVATE: (id: string) => `/patients/${id}/deactivate`,
    REACTIVATE: (id: string) => `/patients/${id}/reactivate`,
  },
  PAYMENT_METHODS: {
    BASE: "/payment-methods",
    BY_ID: (id: string) => `/payment-methods/${id}`,
    DEACTIVATE: (id: string) => `/payment-methods/${id}/deactivate`,
    REORDER: "/payment-methods/reorder",
  },
  PRACTITIONERS: {
    BASE: "/practitioners",
    BY_ID: (id: string) => `/practitioners/${id}`,
    DEACTIVATE: (id: string) => `/practitioners/${id}/deactivate`,
    REACTIVATE: (id: string) => `/practitioners/${id}/reactivate`,
    REPLACE_SERVICES: (id: string) => `/practitioners/${id}/services`,
    REPLACE_AVAILABILITY: (id: string) => `/practitioners/${id}/availability`,
    REPLACE_TIME_OFF: (id: string) => `/practitioners/${id}/time-off`,
  },
  REFERRALS: {
    BASE: "/referrals",
    ACCEPT: (id: string) => `/referrals/${id}/accept`,
    REJECT: (id: string) => `/referrals/${id}/reject`,
    OPINION: (id: string) => `/referrals/${id}/opinion`,
  },
  REPORTS: {
    PATIENT_MEDICAL: (patientId: string) => `/reports/patients/${patientId}`,
    REFERRALS: "/reports/referrals",
    FINANCE: "/reports/finance",
  },
  ROOMS: {
    BASE: "/rooms",
    BY_ID: (id: string) => `/rooms/${id}`,
    DEACTIVATE: (id: string) => `/rooms/${id}/deactivate`,
    REACTIVATE: (id: string) => `/rooms/${id}/reactivate`,
  },
  SERVICES: {
    BASE: "/services",
    BY_ID: (id: string) => `/services/${id}`,
    DEACTIVATE: (id: string) => `/services/${id}/deactivate`,
    REACTIVATE: (id: string) => `/services/${id}/reactivate`,
  },
} as const;
