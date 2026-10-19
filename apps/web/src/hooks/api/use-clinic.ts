import { useMemo, useSyncExternalStore } from "react";
import { useClinicId } from "../shared/use-clinic-id";
import {
  CLINIC_BRAND_EVENT,
  applyClinicBrandChrome,
  readClinicBrand,
  versionedAssetUrl,
  writeClinicBrand,
} from "@/lib/clinic-logo";
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

function subscribeToClinicBrand(listener: () => void) {
  window.addEventListener(CLINIC_BRAND_EVENT, listener);
  window.addEventListener("clinic-logo", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CLINIC_BRAND_EVENT, listener);
    window.removeEventListener("clinic-logo", listener);
    window.removeEventListener("storage", listener);
  };
}

const brandSnapshots = new Map<string, ReturnType<typeof readClinicBrand>>();

function clinicBrandSnapshot(clinicId: string) {
  const next = readClinicBrand(clinicId || undefined);
  const previous = brandSnapshots.get(clinicId) ?? null;
  if (
    previous?.logoUrl === next?.logoUrl &&
    previous?.brandColor === next?.brandColor &&
    previous?.stamp === next?.stamp
  ) return previous;
  brandSnapshots.set(clinicId, next);
  return next;
}

export function useClinicBrand() {
  const clinicId = useClinicId();
  const { data: clinic } = useClinic(clinicId);
  const read = useMemo(
    () => () => clinicBrandSnapshot(clinicId),
    [clinicId],
  );
  const stored = useSyncExternalStore(subscribeToClinicBrand, read, () => null);
  const source = clinic
    ? {
        logoUrl: clinic.logoUrl,
        brandColor: clinic.brandColor,
        stamp: clinic.updatedAt,
      }
    : stored ?? { logoUrl: null, brandColor: null, stamp: "0" };
  const { logoUrl, brandColor, stamp } = source;
  const displayLogoUrl = logoUrl ? versionedAssetUrl(logoUrl, stamp) : null;
  return useMemo(
    () => ({ logoUrl, brandColor, stamp, displayLogoUrl }),
    [displayLogoUrl, brandColor, logoUrl, stamp],
  );
}

export function useClinicLogo() {
  return useClinicBrand().displayLogoUrl;
}

export function bindClinicBrand(
  node: HTMLElement | null,
  brand: { logoUrl: string | null; brandColor: string | null; stamp?: string },
  persist?: { clinicId: string; clinic?: Clinic },
) {
  if (!node) return;
  if (persist?.clinicId && persist.clinic) {
    writeClinicBrand(persist.clinicId, {
      logoUrl: persist.clinic.logoUrl,
      brandColor: persist.clinic.brandColor,
      stamp: persist.clinic.updatedAt,
    });
  }
  return applyClinicBrandChrome(brand);
}
