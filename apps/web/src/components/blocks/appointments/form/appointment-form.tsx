'use client';

import { useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { appointmentAccess, canEditAppointment } from '@clinic/types';
import { FormActions } from '@/components/primitives';
import { useAppointmentFormResources } from '@/hooks/api/use-appointment-form';
import { usePractitioner } from '@/hooks/api/use-practitioners';
import { isPractitionerAvailable } from '@/lib/practitioner-availability';
import { useNow } from '@/hooks/shared/use-now';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useClinic } from '@/hooks/api/use-clinic';
import { extractErrorMessage, isHttpStatus } from '@/lib/api';
import { appointmentSchema, type AppointmentFormData } from '@/lib/validations';
import { resolveWaitingMins } from '@/lib/waiting-time';
import { useAuth, useConfirm, useLanguage } from '@/providers';
import type { Appointment, AppointmentStatus } from '@/services/appointments.service';
import { AppointmentBillingFields } from './appointment-form-billing';
import {
  AppointmentNotesFields,
  AppointmentScheduleFields,
  AppointmentSessionFields,
  AppointmentStatusFields,
  type AppointmentReadOnly,
} from './appointment-form-sections';
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
import { browserTimeZone, formatDate, formatTime } from '@/lib/datetime';
import { getBilingualName } from '@/i18n';
import { formatDoctorLabel, patientDisplayName } from '../shared/appointment-display';

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
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const access = appointmentAccess(user?.role);
  const clinicId = useClinicId();
  const { data: clinic } = useClinic(clinicId);
  const confirm = useConfirm();
  const isEdit = !!appointment;
  const now = useNow(30_000);

  const form = useForm<AppointmentFormData>({
    resolver: async (values, context, options) => {
      if (isEdit && !canEditAppointment(user?.role, 'schedule')) {
        return { values, errors: {} };
      }
      return zodResolver(appointmentSchema)(values, context, options);
    },
    defaultValues: appointment
      ? toAppointmentFormValues(appointment, clinic?.timezone || browserTimeZone())
      : emptyAppointmentValues({
          date: defaultDate,
          time: defaultTime,
          doctorId: currentDoctorId,
          departmentId: clinic?.defaultDepartmentId ?? '',
          sessionType: clinic?.defaultSessionType,
        }),
  });
  const { control, handleSubmit, setValue } = form;

  const sessionType = useWatch({ control, name: 'sessionType' });
  const serviceId = useWatch({ control, name: 'serviceId' });
  const doctorId = useWatch({ control, name: 'doctorId' });
  const date = useWatch({ control, name: 'date' });
  const durationMins = useWatch({ control, name: 'durationMins' });
  const practitioner = usePractitioner(doctorId);
  const schedule = practitioner.data;
  const isTimeAvailable = schedule && date
    ? (hours: number, minutes: number) => isPractitionerAvailable(schedule, date, hours, minutes, Number(durationMins) || 0, clinic?.timezone || browserTimeZone())
    : undefined;
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
  const readOnly = useMemo<AppointmentReadOnly | undefined>(() => {
    if (!appointment) return undefined;
    const online = appointment.sessionType === 'online';
    const room = getBilingualName(appointment.room?.name, appointment.room?.nameAr, lang);
    const department = getBilingualName(
      appointment.department?.name,
      appointment.department?.nameAr,
      lang,
    );
    const service = getBilingualName(
      appointment.service?.name,
      appointment.service?.nameAr,
      lang,
    );
    return {
      patient: patientDisplayName(appointment, lang),
      doctor: formatDoctorLabel(appointment.doctor, { lang }),
      department,
      service,
      date: formatDate(appointment.scheduledAt, '—', lang),
      time: formatTime(appointment.scheduledAt, '—', lang),
      duration: String(appointment.durationMins),
      session: online ? t.appointments.online : t.appointments.inPerson,
      placeLabel: online ? t.appointments.meetingLink : t.appointments.room,
      place: online ? (appointment.meetingUrl ?? '') : room,
      notes: appointment.notes ?? '',
    };
  }, [appointment, lang, t]);

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
        title: t.appointments.schedulingConflict,
        description: extractErrorMessage(error),
        confirmLabel: t.common.confirm,
        cancelLabel: t.common.close,
      });
    }
  };

  const onSubmit = async (input: AppointmentFormData) => {
    const practitioner = staff?.find((member) => member.id === input.doctorId);
    const data: AppointmentFormData = {
      ...input,
      departmentId: practitioner ? (practitioner.departmentId ?? '') : input.departmentId,
    };
    if (fixedExceedsFee) {
      toast.error(t.appointments.fixedDiscountExceedsFee);
      return;
    }

    if (isEdit && appointment) {
      if (status === 'cancelled' && appointment.status !== 'cancelled') {
        const ok = await confirm({
          title: t.appointments.cancelConfirmTitle,
          description: t.appointments.cancelConfirmDesc,
          variant: 'destructive',
          confirmLabel: t.appointments.cancelAppointment,
        });
        if (!ok) return;
      }
      if (status === 'cancelled' && !cancelReason.trim()) {
        toast.error(t.appointments.cancellationReasonRequired);
        return;
      }

      updateMutation.mutate(
        {
          id: appointment.id,
          data: toUpdateAppointmentInput(data, appliedCodeId, {
            status,
            cancelReason: status === 'cancelled' ? cancelReason.trim() : undefined,
          }, user?.role, clinic?.timezone || browserTimeZone()),
        },
        {
          onSuccess: (res) => onSuccess(res.id),
          onError: showConflict,
        },
      );
      return;
    }

    createMutation.mutate(toCreateAppointmentInput(data, appliedCodeId, clinic?.timezone || browserTimeZone()), {
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
      toast.error(t.appointments.removePackageCoverageFirst);
      return;
    }
    if (paid) {
      if (!payMethodId) {
        toast.error(t.appointments.selectPaymentMethodFirst);
        return;
      }
      markPaidMutation.mutate({ id: appointment.id, paymentMethodId: payMethodId });
      return;
    }
    const ok = await confirm({
      title: t.appointments.markAsUnpaidTitle,
      description: t.appointments.markAsUnpaidDesc,
      confirmLabel: t.appointments.markUnpaid,
    });
    if (!ok) return;
    markUnpaidMutation.mutate(appointment.id);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-4" noValidate>
      {isEdit && (
        <AppointmentStatusFields
          status={status}
          cancelReason={cancelReason}
          waitingMins={waitingMins}
          canEdit={access.status}
          onStatusChange={setStatus}
          onCancelReasonChange={setCancelReason}
        />
      )}

      <AppointmentVisitFields
        patients={patients}
        staff={staff}
        departments={departments}
        services={services}
        currentDoctorName={currentDoctorName}
        access={access}
        readOnly={readOnly}
        onPatientChange={(id) => {
          const applied = billingDefaultsForPatient(
            patients?.find((patient) => patient.id === id),
            packages,
            discountCodes,
            lang,
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

      <AppointmentScheduleFields locked={!access.schedule} values={readOnly} isTimeAvailable={isTimeAvailable} />

      <AppointmentSessionFields
        sessionType={sessionType}
        selectedService={selectedService}
        rooms={rooms}
        locked={!access.session}
        values={readOnly}
      />

      <AppointmentBillingFields
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
              applyDiscount(discountFromCode(res, lang));
              toast.success(`${t.appointments.appliedPromo} ${res.code}`);
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
        canManage={access.billing}
      />

      <AppointmentNotesFields locked={!access.notes} value={readOnly?.notes} />

      <FormActions
        onCancel={onCancel}
        pending={isPending}
        submitLabel={
          isEdit
            ? t.common.saveChanges
            : t.appointments.newAppointment
        }
      />
      </form>
    </FormProvider>
  );
}
