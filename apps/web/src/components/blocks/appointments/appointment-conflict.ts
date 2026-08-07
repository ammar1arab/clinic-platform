import type { Appointment } from '@/services/appointments.service';

export function hasScheduleConflict(
  appointments: Appointment[] | undefined,
  appt: Appointment,
  startTime: number,
  durationMins: number,
) {
  const endTime = startTime + durationMins * 60000;
  return Boolean(
    appointments?.some((other) => {
      if (other.id === appt.id) return false;
      if (other.status === 'cancelled' || other.status === 'no_show') return false;
      const otherStart = new Date(other.scheduledAt).getTime();
      const otherEnd = otherStart + other.durationMins * 60000;
      if (!(startTime < otherEnd && endTime > otherStart)) return false;
      return (
        other.doctorId === appt.doctorId ||
        Boolean(appt.roomId && other.roomId && other.roomId === appt.roomId)
      );
    }),
  );
}
