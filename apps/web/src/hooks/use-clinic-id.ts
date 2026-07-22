'use client';

import { useAuth } from '@/providers';

/** Clinic ID from the authenticated user. Empty string while auth is loading / logged out. */
export function useClinicId(): string {
  const { user } = useAuth();
  return user?.clinic.id ?? '';
}
