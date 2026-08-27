import { useMemo, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socket';
import { createLogger } from '@/lib/logger';
import { QUERY_KEYS } from '@/constants/query-keys';
import { INVALIDATE } from '../query';

const log = createLogger('hooks/realtime');

export type ClinicRealtimeOptions = {
  notifyOnAppointmentChange?: boolean;
};

export function useClinicRealtime(
  clinicId: string,
  options: ClinicRealtimeOptions = {},
) {
  const queryClient = useQueryClient();
  const notify = options.notifyOnAppointmentChange ?? false;

  const subscribe = useMemo(() => {
    return (onStoreChange: () => void) => {
      if (!clinicId) return () => {};

      const socket = getSocket();
      if (!socket.connected) socket.connect();

      const join = () => {
        socket.emit('join-clinic', clinicId);
        log.debug('joined', { clinicId });
        onStoreChange();
      };
      const onDisconnect = () => {
        log.warn('disconnected', { clinicId });
        onStoreChange();
      };
      const onConnectError = (err: Error) => {
        log.error('connect_failed', err);
      };

      if (socket.connected) join();
      socket.on('connect', join);
      socket.on('disconnect', onDisconnect);
      socket.on('connect_error', onConnectError);

      const refreshAppointments = () => {
        log.debug('appointment_changed', { clinicId });
        for (const key of INVALIDATE.appointmentWrite) {
          void queryClient.invalidateQueries({ queryKey: key });
        }
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.patientPackages.all,
        });
        if (notify) {
          toast.message('Schedule updated', {
            description: 'Dashboard refreshed from live clinic changes.',
            duration: 2200,
          });
        }
      };

      const refreshReferrals = () => {
        log.debug('referral_changed', { clinicId });
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.referrals.all,
        });
      };

      socket.on('appointment-changed', refreshAppointments);
      socket.on('referral-changed', refreshReferrals);

      return () => {
        socket.emit('leave-clinic', clinicId);
        socket.off('connect', join);
        socket.off('disconnect', onDisconnect);
        socket.off('connect_error', onConnectError);
        socket.off('appointment-changed', refreshAppointments);
        socket.off('referral-changed', refreshReferrals);
      };
    };
  }, [clinicId, notify, queryClient]);

  const connected = useSyncExternalStore(
    subscribe,
    () => (clinicId ? getSocket().connected : false),
    () => false,
  );

  return { connected };
}
