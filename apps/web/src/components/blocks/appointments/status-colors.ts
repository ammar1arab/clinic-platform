import { AppointmentStatus } from '@/services/appointments.service';

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  unconfirmed: '#f59e0b',
  confirmed: '#22c55e',
  checked_in: '#14b8a6',
  waiting: '#eab308',
  in_progress: '#3b82f6',
  completed: '#6366f1',
  no_show: '#ef4444',
  cancelled: '#9ca3af',
};
