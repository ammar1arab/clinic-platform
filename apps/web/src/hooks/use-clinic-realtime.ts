import { useSyncExternalStore, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socket';
import { QUERY_KEYS } from '@/constants/query-keys';

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
        onStoreChange();
      };
      const onDisconnect = () => onStoreChange();

      if (socket.connected) join();
      socket.on('connect', join);
      socket.on('disconnect', onDisconnect);

      const refreshAppointments = () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments.all });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patientPackages.all });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.kpisAll });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.dashboard.roomUtilizationAll,
        });
        if (notify) {
          toast.message('Schedule updated', {
            description: 'Dashboard refreshed from live clinic changes.',
            duration: 2200,
          });
        }
      };

      const refreshReferrals = () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.referrals.all });
      };

      socket.on('appointment-changed', refreshAppointments);
      socket.on('referral-changed', refreshReferrals);

      return () => {
        socket.emit('leave-clinic', clinicId);
        socket.off('connect', join);
        socket.off('disconnect', onDisconnect);
        socket.off('appointment-changed', refreshAppointments);
        socket.off('referral-changed', refreshReferrals);
      };
    };
  }, [clinicId, notify, queryClient]);

  const connected = useSyncExternalStore(
    subscribe,
    () => {
      if (!clinicId) return false;
      const socket = getSocket();
      return socket.connected;
    },
    () => false,
  );

  return { connected };
}
