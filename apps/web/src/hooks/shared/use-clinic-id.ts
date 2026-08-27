'use client';

import { useAuth } from '@/providers';

export function useClinicId(): string {
  const { user } = useAuth();
  return user?.clinic.id ?? '';
}
