'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { FormActions } from '@/components/primitives';
import { useAppointmentFormResources } from '@/hooks/api/use-appointment-form';
import { useNow } from '@/hooks/shared/use-now';
import { extractErrorMessage, isHttpStatus } from '@/lib/api';
import { appointmentSchema, type AppointmentFormData } from '@/lib/validations';
import { resolveWaitingMins } from '@/lib/waiting-time';
import { useConfirm } from '@/providers';
import type { Appointment, AppointmentStatus } from '@/services/appointments.service';
import { AppointmentBillingFields } from './appointment-form-billing';
import { AppointmentNotesFields } from './appointment-form-notes';
import { AppointmentScheduleFields } from './appointment-form-schedule';
import { AppointmentSessionFields } from './appointment-form-session';
import { AppointmentStatusFields } from './appointment-form-status';
import { AppointmentVisitFields } from './appointment-form-visit';
import {
  billingDefaultsForPatient,
  discountExceedsFee,
  discountFromCode,
  emptyAppointmentValues,
  resolveBaseFee,
  resolvePricing,
  toAppointmentFormValues,
  toCreateAppointmentInput,
  toUpdateAppointmentInput,
  type AppliedDiscount,
} from './appointment-form.mapper';

interface Props {
  appointment?: Appointment;
  defaultDate?: string;
  defaultTime?: string;
  currentDoctorId: string;
  currentDoctorName: string;
  onCancel: () => void;
  onSuccess: (id: string) => void;
}

export function AppointmentForm({
  appointment,
  defaultDate,
  defaultTime,
  currentDoctorId,
  currentDoctorName,
  onCancel,
  onSuccess,
}: Props) {
  const isEdit = !!appointment;
  const confirm = useConfirm();
  const now = useNow(30_000);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: appointment
      ? toAppointmentFormValues(appointment)
      : emptyAppointmentValues({
          date: defaultDate,
          time: defaultTime,
          doctorId: currentDoctorId,
        }),
  });

  const sessionType = useWatch({ control, name: 'sessionType' });
  const serviceId = useWatch({ control, name: 'serviceId' });
  const patientId = useWatch({ control, name: 'patientId' });
  const feeOverride = useWatch({ control, name: 'feeOverride' });
  const discount = useWatch({ control, name: 'discount' });
  const discountType = useWatch({ control, name: 'discountType' });

  const resources = useAppointmentFormResources(patientId, appointment?.id);
  const {
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
  } = resources;

  const [status, setStatus] = useState<AppointmentStatus>(appointment?.status ?? 'unconfirmed');
  const [cancelReason, setCancelReason] = useState(appointment?.cancelReason ?? '');
  const [payMethodId, setPayMethodId] = useState(appointment?.paymentMethodId ?? '');
  const [promoCode, setPromoCode] = useState('');
  const [appliedCodeId, setAppliedCodeId] = useState<string | null>(null);
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);

  const [prevPatientId, setPrevPatientId] = useState(patientId);
  if (patientId !== prevPatientId) {
    setPrevPatientId(patientId);
    setPendingPackageId(null);
  }

  const waitingMins = appointment
    ? resolveWaitingMins({
        status,
        scheduledAt: appointment.scheduledAt,
        waitingStartedAt: appointment.waitingStartedAt,
        waitingMins: appointment.waitingMins,
        now,
      })
    : null;

  const selectedService = useMemo(
    () => services?.find((service) => service.id === serviceId),
    [services, serviceId],
  );
  const baseFee = resolveBaseFee(feeOverride, selectedService?.fee);
  const pricing = useMemo(
    () => resolvePricing(baseFee, discount, discountType),
    [baseFee, discount, discountType],
  );
  const fixedExceedsFee = discountExceedsFee(discount, discountType, baseFee);
  const pricingLocked = !!appointment?.patientPackageId;

  const applyDiscount = (applied: AppliedDiscount) => {
    setValue('discount', applied.discount);
    setValue('discountType', applied.discountType);
    setValue('discountReason', applied.discountReason);
    if (applied.appliedCodeId) setAppliedCodeId(applied.appliedCodeId);
    if (applied.promoCode) setPromoCode(applied.promoCode);
  };

  const showConflict = async (error: Parameters<typeof extractErrorMessage>[0]) => {
    if (isHttpStatus(error, 409)) {
      await confirm({
        title: 'Scheduling conflict',
        description: extractErrorMessage(error),
        confirmLabel: 'OK',
        cancelLabel: 'Close',
      });
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (fixedExceedsFee) {
      toast.error('Fixed discount cannot exceed the fee');
      return;
    }

    if (isEdit && appointment) {
      if (status === 'cancelled' && appointment.status !== 'cancelled') {
        const ok = await confirm({
          title: 'Cancel this appointment?',
          description: 'The patient will need to be informed separately.',
          variant: 'destructive',
          confirmLabel: 'Cancel appointment',
        });
        if (!ok) return;
      }
      if (status === 'cancelled' && !cancelReason.trim()) {
        toast.error('Cancellation reason is required');
        return;
      }

      updateMutation.mutate(
        {
          id: appointment.id,
          data: toUpdateAppointmentInput(data, appliedCodeId, {
            status,
            cancelReason: status === 'cancelled' ? cancelReason.trim() : undefined,
          }),
        },
        {
          onSuccess: (res) => onSuccess(res.id),
          onError: showConflict,
        },
      );
      return;
    }

    createMutation.mutate(toCreateAppointmentInput(data, appliedCodeId), {
      onSuccess: async (res) => {
        if (pendingPackageId) {
          try {
            await redeemPackage.mutateAsync({
              id: res.id,
              patientPackageId: pendingPackageId,
            });
          } catch {}
        }
        onSuccess(res.id);
      },
      onError: showConflict,
    });
  };

  const handleTogglePaid = async (paid: boolean) => {
    if (!appointment) return;
    if (appointment.patientPackageId) {
      toast.error('Remove package coverage before changing payment status');
      return;
    }
    if (paid) {
      if (!payMethodId) {
        toast.error('Select a payment method first');
        return;
      }
      markPaidMutation.mutate({ id: appointment.id, paymentMethodId: payMethodId });
      return;
    }
    const ok = await confirm({
      title: 'Mark as unpaid?',
      description: 'This clears the recorded payment for this appointment.',
      confirmLabel: 'Mark unpaid',
    });
    if (!ok) return;
    markUnpaidMutation.mutate(appointment.id);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-4" noValidate>
      {isEdit && (
        <AppointmentStatusFields
          status={status}
          cancelReason={cancelReason}
          waitingMins={waitingMins}
          onStatusChange={setStatus}
          onCancelReasonChange={setCancelReason}
        />
      )}

      <AppointmentVisitFields
        control={control}
        errors={errors}
        patients={patients}
        staff={staff}
        departments={departments}
        services={services}
        currentDoctorName={currentDoctorName}
        onPatientChange={(id) => {
          const applied = billingDefaultsForPatient(
            patients?.find((patient) => patient.id === id),
            packages,
            discountCodes,
          );
          if (applied) applyDiscount(applied);
        }}
        onServiceChange={(id) => {
          const service = services?.find((item) => item.id === id);
          if (!service) return;
          setValue('durationMins', String(service.durationMins));
          if (service.supportedModes?.length && !service.supportedModes.includes(sessionType)) {
            setValue('sessionType', service.supportedModes[0]);
          }
        }}
      />

      <AppointmentScheduleFields control={control} errors={errors} register={register} />

      <AppointmentSessionFields
        control={control}
        errors={errors}
        register={register}
        sessionType={sessionType}
        selectedService={selectedService}
        rooms={rooms}
      />

      <AppointmentBillingFields
        control={control}
        errors={errors}
        register={register}
        appointment={appointment}
        isEdit={isEdit}
        hasPatient={!!patientId}
        selectedService={selectedService}
        pricing={pricing}
        pricingLocked={pricingLocked}
        fixedExceedsFee={fixedExceedsFee}
        promoCode={promoCode}
        onPromoCodeChange={setPromoCode}
        validatePending={validateCode.isPending}
        onApplyCode={() => {
          validateCode.mutate(promoCode.trim(), {
            onSuccess: (res) => {
              applyDiscount(discountFromCode(res));
              toast.success(`Applied ${res.code}`);
            },
          });
        }}
        billing={billing}
        billingLoading={billingLoading}
        pendingPackageId={pendingPackageId}
        onSelectPending={setPendingPackageId}
        onRedeem={(patientPackageId) => {
          if (!appointment) return;
          redeemPackage.mutate({ id: appointment.id, patientPackageId });
        }}
        onRelease={() => {
          if (!appointment) return;
          releasePackage.mutate(appointment.id);
        }}
        redeemPending={redeemPackage.isPending}
        releasePending={releasePackage.isPending}
        payMethodId={payMethodId}
        onPayMethodChange={setPayMethodId}
        paymentMethods={activePayMethods}
        onTogglePaid={handleTogglePaid}
        paidPending={markPaidMutation.isPending || markUnpaidMutation.isPending}
      />

      <AppointmentNotesFields register={register} error={errors.notes?.message} />

      <FormActions
        onCancel={onCancel}
        pending={isPending}
        submitLabel={isEdit ? 'Save Changes' : 'Create Appointment'}
      />
    </form>
  );
}
