import { useMemo } from 'react';
import { useClinicStaff } from './use-clinic-staff';
import {
  useCreateAppointment,
  useMarkAppointmentPaid,
  useMarkAppointmentUnpaid,
  useRedeemAppointmentPackage,
  useReleaseAppointmentPackage,
  useUpdateAppointment,
} from './use-appointments';
import { useDepartments } from './use-departments';
import { useDiscountCodes, useValidateDiscountCode } from './use-discount-codes';
import { usePackages } from './use-packages';
import { usePatientBilling } from './use-patient-packages';
import { usePatients } from './use-patients';
import { usePaymentMethods } from './use-payment-methods';
import { useRooms } from './use-rooms';
import { useServices } from './use-services';
import { useClinicId } from '@/hooks/shared/use-clinic-id';

export function useAppointmentFormResources(
  patientId: string,
  appointmentId?: string,
) {
  const clinicId = useClinicId();
  const { data: patients } = usePatients({ clinicId, isActive: true });
  const { data: departments } = useDepartments(clinicId);
  const { data: rooms } = useRooms(clinicId);
  const { data: services } = useServices(clinicId);
  const { data: staff } = useClinicStaff(clinicId);
  const { data: packages } = usePackages(clinicId);
  const { data: discountCodes } = useDiscountCodes(clinicId);
  const { data: paymentMethods } = usePaymentMethods(clinicId);
  const { data: billing, isLoading: billingLoading } = usePatientBilling(
    patientId,
    !!patientId,
    appointmentId,
  );

  const validateCode = useValidateDiscountCode(clinicId);
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const markPaidMutation = useMarkAppointmentPaid();
  const markUnpaidMutation = useMarkAppointmentUnpaid();
  const redeemPackage = useRedeemAppointmentPackage();
  const releasePackage = useReleaseAppointmentPackage();

  const activePayMethods = useMemo(
    () =>
      (paymentMethods ?? [])
        .filter((method) => method.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [paymentMethods],
  );

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    markPaidMutation.isPending ||
    markUnpaidMutation.isPending ||
    redeemPackage.isPending ||
    releasePackage.isPending;

  return {
    patients,
    departments,
    rooms,
    services,
    staff,
    packages,
    discountCodes,
    activePayMethods,
    billing,
    billingLoading,
    validateCode,
    createMutation,
    updateMutation,
    markPaidMutation,
    markUnpaidMutation,
    redeemPackage,
    releasePackage,
    isPending,
  };
}
