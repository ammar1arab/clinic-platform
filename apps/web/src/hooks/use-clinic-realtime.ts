import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socket';
import { QUERY_KEYS } from '@/constants/query-keys';


let socketUsers = 0;

export type ClinicRealtimeOptions = {

  notifyOnAppointmentChange?: boolean;
};



export function useClinicRealtime(
  clinicId: string,
  options: ClinicRealtimeOptions = {},
) {
  const queryClient = useQueryClient();
  const joined = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const notify = options.notifyOnAppointmentChange ?? false;

  useEffect(() => {
    if (!clinicId) return;

    const socket = getSocket();
    socketUsers += 1;
    if (!socket.connected) socket.connect();

    const join = () => {
      socket.emit('join-clinic', clinicId);
      joined.current = clinicId;
      setConnected(true);
    };

    const onDisconnect = () => setConnected(false);

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
      socket.off('appointment-changed', refreshAppointments);
      socket.off('referral-changed', refreshReferrals);
      socket.off('connect', join);
      socket.off('disconnect', onDisconnect);
      socketUsers = Math.max(0, socketUsers - 1);
      if (socketUsers === 0) {
        socket.disconnect();
        joined.current = null;
        setConnected(false);
      }
    };
  }, [clinicId, queryClient, notify]);

  return { connected };
}
