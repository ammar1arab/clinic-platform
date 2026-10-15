import { useMemo, useSyncExternalStore } from "react";
import { useClinicId } from "../shared/use-clinic-id";
import { readClinicLogo } from "@/lib/clinic-logo";
import {
  clinicsService,
  UpdateClinicInput,
  Clinic,
} from "@/services/clinics.service";
import { QUERY_KEYS } from "@/constants/query-keys";
import { useFetchData, type TResponseError, useApiMutation } from "../query";
import { useLanguage } from "@/providers";

export function useClinic(clinicId: string) {
  return useFetchData<Clinic>({
    queryKey: QUERY_KEYS.clinics.detail(clinicId),
    request: () => clinicsService.getOne(clinicId),
    options: {
      enabled: !!clinicId,
    },
  });
}

export function useUpdateClinic(clinicId: string) {
  const { t } = useLanguage();
  return useApiMutation<Clinic, TResponseError, UpdateClinicInput>({
    request: (data) => clinicsService.update(clinicId, data),
    invalidateQueries: [
      QUERY_KEYS.clinics.detail(clinicId),
      QUERY_KEYS.emails.all,
    ],
    successMessage: t.common.clinicSettingsSaved,
  });
}

function subscribeToClinicLogo(listener: () => void) {
  window.addEventListener("clinic-logo", listener);
  return () => window.removeEventListener("clinic-logo", listener);
}

export function useClinicLogo() {
  const clinicId = useClinicId();
  const { data: clinic } = useClinic(clinicId);
  const read = useMemo(
    () => () => (clinicId ? readClinicLogo(clinicId) : null),
    [clinicId],
  );
  const stored = useSyncExternalStore(subscribeToClinicLogo, read, () => null);

  return stored || clinic?.logoUrl || null;
}
