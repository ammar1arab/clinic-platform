'use client';

import { useMemo, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Video, MapPin, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ButtonSpinner } from '@/components/blocks/feedback/button-spinner';
import { DatePicker } from '@/components/primitives/date-picker';
import { TimePicker } from '@/components/primitives/time-picker';
import { StatusBadgeBlock, STATUS_CONFIG } from './status-badge';
import { PatientCombobox } from './patient-combobox';
import { useDepartments } from '@/hooks/use-departments';
import { useRooms } from '@/hooks/use-rooms';
import { useServices } from '@/hooks/use-services';
import { usePatients } from '@/hooks/use-patients';
import { useClinicStaff } from '@/hooks/use-clinic-staff';
import { useClinicId } from '@/hooks/use-clinic-id';
import { useCreateAppointment, useUpdateAppointment, useMarkAppointmentPaid, useMarkAppointmentUnpaid } from '@/hooks/use-appointments';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { useValidateDiscountCode, useDiscountCodes } from '@/hooks/use-discount-codes';
import { usePackages } from '@/hooks/use-packages';
import { useConfirm } from '@/providers';
import { appointmentSchema, AppointmentFormData } from '@/lib/validations';
import {
  Appointment,
  AppointmentStatus,
  computePayable,
} from '@/services/appointments.service';
import type { Patient } from '@/services/patients.service';
import type { ClinicPackage } from '@/services/packages.service';
import type { DiscountCode, ValidatedDiscountCode } from '@/services/discount-codes.service';
import { toast } from 'sonner';
import axios from 'axios';
import { extractErrorMessage } from '@/lib/api';
import { Switch } from '@/components/ui/switch';

const NONE = '__none__';
const CURRENCY = 'JOD';

const STATUS_OPTIONS: AppointmentStatus[] = [
  'unconfirmed',
  'confirmed',
  'checked_in',
  'waiting',
  'in_progress',
  'completed',
  'no_show',
  'cancelled',
];

interface Props {
  appointment?: Appointment;
  defaultDate?: string;
  defaultTime?: string;
  currentDoctorId: string;
  currentDoctorName: string;
  onCancel: () => void;
  onSuccess: (id: string) => void;
}

const EMPTY_VALUES: AppointmentFormData = {
  patientId: '',
  doctorId: '',
  departmentId: '',
  roomId: '',
  serviceId: '',
  date: '',
  time: '',
  durationMins: '45',
  sessionType: 'in_person',
  meetingUrl: '',
  feeOverride: '',
  discount: '',
  discountType: 'fixed',
  discountReason: '',
  notes: '',
};

function toFormValues(appt: Appointment): AppointmentFormData {
  const dt = new Date(appt.scheduledAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    patientId: appt.patientId,
    doctorId: appt.doctorId,
    departmentId: appt.departmentId ?? '',
    roomId: appt.roomId ?? '',
    serviceId: appt.serviceId ?? '',
    date: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
    time: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
    durationMins: String(appt.durationMins),
    sessionType: appt.sessionType,
    meetingUrl: appt.meetingUrl ?? '',
    feeOverride: appt.fee != null ? String(Number(appt.fee)) : '',
    discount:
      appt.discount != null && Number(appt.discount) > 0 ? String(Number(appt.discount)) : '',
    discountType: appt.discountType ?? 'fixed',
    discountReason: appt.discountReason ?? '',
    notes: appt.notes ?? '',
  };
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
  const clinicId = useClinicId();
  const confirm = useConfirm();

  const { data: patients } = usePatients({ clinicId, isActive: true });
  const { data: departments } = useDepartments(clinicId);
  const { data: rooms } = useRooms(clinicId);
  const { data: services } = useServices(clinicId);
  const { data: staff } = useClinicStaff(clinicId);
  const { data: packages } = usePackages(clinicId);
  const { data: discountCodes } = useDiscountCodes(clinicId);

  const { data: paymentMethods } = usePaymentMethods(clinicId);
  const validateCode = useValidateDiscountCode(clinicId);
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const markPaidMutation = useMarkAppointmentPaid();
  const markUnpaidMutation = useMarkAppointmentUnpaid();
  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    markPaidMutation.isPending ||
    markUnpaidMutation.isPending;

  const [status, setStatus] = useState<AppointmentStatus>(
    appointment?.status ?? 'unconfirmed',
  );
  const [cancelReason, setCancelReason] = useState(appointment?.cancelReason ?? '');
  const [payMethodId, setPayMethodId] = useState(
    appointment?.paymentMethodId ?? '',
  );
  const [promoCode, setPromoCode] = useState('');
  const [appliedCodeId, setAppliedCodeId] = useState<string | null>(null);

  const activePayMethods = useMemo(
    () => (paymentMethods ?? []).filter((m) => m.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [paymentMethods],
  );

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: appointment
      ? toFormValues(appointment)
      : {
          ...EMPTY_VALUES,
          date: defaultDate ?? '',
          time: defaultTime ?? '',
          doctorId: currentDoctorId,
        },
  });

  const sessionType = useWatch({ control, name: 'sessionType' });
  const serviceId = useWatch({ control, name: 'serviceId' });
  const feeOverride = useWatch({ control, name: 'feeOverride' });
  const discount = useWatch({ control, name: 'discount' });
  const discountType = useWatch({ control, name: 'discountType' });

  const selectedService = useMemo(
    () => services?.find((s) => s.id === serviceId),
    [services, serviceId],
  );

  const baseFee = feeOverride.trim()
    ? Number(feeOverride)
    : selectedService
      ? Number(selectedService.fee)
      : 0;

  const pricing = useMemo(
    () => computePayable(baseFee, discount.trim() ? Number(discount) : 0, discountType),
    [baseFee, discount, discountType],
  );

  const fixedExceedsFee =
    discountType === 'fixed' && !!discount.trim() && Number(discount) > baseFee && baseFee > 0;

  const applyPatientBillingDefaults = (patientId: string) => {
    const patient = patients?.find((p) => p.id === patientId) as Patient | undefined;
    if (!patient) return;

    const pkg =
      (packages as ClinicPackage[] | undefined)?.find((p) => p.id === patient.packageId) ??
      null;
    if (pkg) {
      if (pkg.price != null && Number(pkg.price) > 0) {
        setValue('feeOverride', String(Number(pkg.price)));
      }
      if (pkg.discountType && pkg.discountValue != null && Number(pkg.discountValue) > 0) {
        setValue('discount', String(Number(pkg.discountValue)));
        setValue('discountType', pkg.discountType);
        setValue('discountReason', `Package: ${pkg.name}`);
      }
    }

    const code =
      (discountCodes as DiscountCode[] | undefined)?.find(
        (c) => c.id === patient.discountCodeId && c.isActive,
      ) ?? null;
    if (code) {
      setValue('discount', String(Number(code.discountValue)));
      setValue('discountType', code.discountType);
      setValue('discountReason', `Code: ${code.code}`);
      setAppliedCodeId(code.id);
      setPromoCode(code.code);
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    const scheduledAt = new Date(`${data.date}T${data.time}:00`).toISOString();
    const hasDiscount = !!data.discount.trim() && Number(data.discount) > 0;

    if (fixedExceedsFee) {
      toast.error('Fixed discount cannot exceed the fee');
      return;
    }

    const shared = {
      patientId: data.patientId,
      doctorId: data.doctorId,
      departmentId: data.departmentId || undefined,
      roomId: data.sessionType === 'in_person' ? data.roomId || undefined : undefined,
      serviceId: data.serviceId || undefined,
      scheduledAt,
      durationMins: Number(data.durationMins),
      sessionType: data.sessionType,
      meetingUrl: data.sessionType === 'online' ? data.meetingUrl.trim() : undefined,
      notes: data.notes.trim() || undefined,
      feeOverride: data.feeOverride.trim() ? Number(data.feeOverride) : undefined,
    };

    const showConflict = async (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        await confirm({
          title: 'Scheduling conflict',
          description: extractErrorMessage(error),
          confirmLabel: 'OK',
          cancelLabel: 'Close',
        });
        return;
      }
      // Non-409 errors already toasted by the API interceptor.
    };

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
          data: {
            ...shared,
            status,
            cancelReason: status === 'cancelled' ? cancelReason.trim() : undefined,
            // Always send discount so it can be cleared on edit.
            discount: hasDiscount ? Number(data.discount) : 0,
            discountType: data.discountType,
            discountReason: hasDiscount ? data.discountReason.trim() : undefined,
            discountCodeId: appliedCodeId,
          },
        },
        {
          onSuccess: (res) => onSuccess(res.id),
          onError: showConflict,
        },
      );
    } else {
      createMutation.mutate(
        {
          ...shared,
          ...(hasDiscount
            ? {
                discount: Number(data.discount),
                discountType: data.discountType,
                discountReason: data.discountReason.trim(),
                discountCodeId: appliedCodeId ?? undefined,
              }
            : {}),
        },
        {
          onSuccess: (res) => onSuccess(res.id),
          onError: showConflict,
        },
      );
    }
  };

  const handleTogglePaid = async (paid: boolean) => {
    if (!appointment) return;
    if (paid) {
      if (!payMethodId) {
        toast.error('Select a payment method first');
        return;
      }
      markPaidMutation.mutate({ id: appointment.id, paymentMethodId: payMethodId });
    } else {
      const ok = await confirm({
        title: 'Mark as unpaid?',
        description: 'This clears the recorded payment for this appointment.',
        confirmLabel: 'Mark unpaid',
      });
      if (!ok) return;
      markUnpaidMutation.mutate(appointment.id);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {isEdit && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Status</CardTitle>
              <StatusBadgeBlock status={status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span className={cn('size-2.5 shrink-0 rounded-full', cfg.dotClassName)} />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {status === 'cancelled' && (
              <div className="space-y-1.5">
                <Label className="text-destructive">Cancellation Reason *</Label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Required when cancelling"
                  rows={2}
                  className="resize-none border-destructive/40"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Visit Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Patient"
            required
            error={errors.patientId?.message}
            className="sm:col-span-2"
          >
            <Controller
              control={control}
              name="patientId"
              render={({ field }) => (
                <PatientCombobox
                  patients={patients}
                  value={field.value}
                  onChange={(id) => {
                    field.onChange(id);
                    if (id) applyPatientBillingDefaults(id);
                  }}
                />
              )}
            />
          </Field>

          <Field label="Doctor" required error={errors.doctorId?.message}>
            <Controller
              control={control}
              name="doctorId"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        {s.role ? ` · ${String(s.role).replace(/_/g, ' ')}` : ''}
                      </SelectItem>
                    ))}
                    {/* Keep current selection visible if staff list hasn't loaded / missing */}
                    {field.value &&
                      !staff?.some((s) => s.id === field.value) &&
                      currentDoctorName && (
                        <SelectItem value={field.value}>{currentDoctorName}</SelectItem>
                      )}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Department" error={errors.departmentId?.message}>
            <Controller
              control={control}
              name="departmentId"
              render={({ field }) => (
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {departments?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Service" error={errors.serviceId?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="serviceId"
              render={({ field }) => (
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => {
                    if (v === NONE) {
                      field.onChange('');
                      return;
                    }
                    field.onChange(v);
                    const svc = services?.find((s) => s.id === v);
                    if (svc) {
                      setValue('durationMins', String(svc.durationMins));
                      if (
                        svc.supportedModes?.length &&
                        !svc.supportedModes.includes(sessionType)
                      ) {
                        setValue('sessionType', svc.supportedModes[0]);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {services?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} · {Number(s.fee).toFixed(3)} {CURRENCY}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Schedule</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Date" required error={errors.date?.message}>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Pick a date"
                  className="h-10"
                />
              )}
            />
          </Field>
          <Field label="Time" required error={errors.time?.message}>
            <Controller
              control={control}
              name="time"
              render={({ field }) => (
                <TimePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Pick a time"
                  className="h-10"
                  step={5}
                />
              )}
            />
          </Field>
          <Field label="Duration (min)" required error={errors.durationMins?.message}>
            <Input className="h-10" type="number" min={5} step={5} {...register('durationMins')} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Session Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            control={control}
            name="sessionType"
            render={({ field }) => {
              const modes = selectedService?.supportedModes;
              const canInPerson = !modes || modes.includes('in_person');
              const canOnline = !modes || modes.includes('online');
              return (
                <div className="grid grid-cols-2 gap-2">
                  <ModeButton
                    active={field.value === 'in_person'}
                    disabled={!canInPerson}
                    icon={<MapPin className="size-4" />}
                    label="In Person"
                    onClick={() => field.onChange('in_person')}
                  />
                  <ModeButton
                    active={field.value === 'online'}
                    disabled={!canOnline}
                    icon={<Video className="size-4" />}
                    label="Online"
                    onClick={() => field.onChange('online')}
                  />
                </div>
              );
            }}
          />

          {sessionType === 'in_person' ? (
            <Field label="Room" required error={errors.roomId?.message}>
              <Controller
                control={control}
                name="roomId"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {rooms?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          ) : (
            <Field label="Meeting Link" required error={errors.meetingUrl?.message}>
              <Input
                type="url"
                inputMode="url"
                placeholder="https://meet.example.com/room"
                {...register('meetingUrl')}
              />
            </Field>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Fee" error={errors.feeOverride?.message}>
              <Input
                type="number"
                min={0}
                step="0.001"
                placeholder={selectedService ? Number(selectedService.fee).toFixed(3) : '0.000'}
                {...register('feeOverride')}
              />
              <p className="text-xs text-muted-foreground">
                {selectedService
                  ? 'Leave blank to use the service fee.'
                  : 'Enter a fee or pick a service.'}
              </p>
            </Field>

            <div className="space-y-1.5">
              <Label>Discount</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  step="0.001"
                  placeholder="0"
                  className="flex-1"
                  {...register('discount')}
                />
                <Controller
                  control={control}
                  name="discountType"
                  render={({ field }) => (
                    <div className="inline-flex overflow-hidden rounded-md border">
                      <ToggleSeg
                        active={field.value === 'fixed'}
                        label={CURRENCY}
                        onClick={() => field.onChange('fixed')}
                      />
                      <ToggleSeg
                        active={field.value === 'percentage'}
                        label="%"
                        onClick={() => field.onChange('percentage')}
                      />
                    </div>
                  )}
                />
              </div>
              {errors.discount?.message && (
                <p className="text-xs text-destructive">{errors.discount.message}</p>
              )}
              {fixedExceedsFee && (
                <p className="text-xs text-destructive">Discount cannot exceed the fee.</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Discount code</Label>
            <div className="flex gap-2">
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Optional promo code"
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                disabled={!promoCode.trim() || validateCode.isPending}
                onClick={() => {
                  validateCode.mutate(promoCode.trim(), {
                    onSuccess: (res: ValidatedDiscountCode) => {
                      setAppliedCodeId(res.id);
                      setValue('discount', String(res.discountValue));
                      setValue('discountType', res.discountType);
                      setValue('discountReason', `Code: ${res.code}`);
                      toast.success(`Applied ${res.code}`);
                    },
                  });
                }}
              >
                {validateCode.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
          </div>

          <Field label="Discount reason" error={errors.discountReason?.message}>
            <Input
              placeholder="Required when a discount is applied"
              {...register('discountReason')}
            />
          </Field>

          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <Row label="Base fee" value={`${pricing.fee.toFixed(3)} ${CURRENCY}`} />
            <Row
              label="Discount"
              value={`- ${pricing.discountAmount.toFixed(3)} ${CURRENCY}`}
              muted
            />
            <div className="mt-2 flex items-center justify-between border-t pt-2 font-semibold">
              <span>Payable</span>
              <span>
                {pricing.payable.toFixed(3)} {CURRENCY}
              </span>
            </div>
          </div>

          {isEdit && appointment && (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Payment status</p>
                  <p className="text-xs text-muted-foreground">
                    {appointment.isPaid
                      ? `Paid${
                          appointment.paymentMethodRef?.name || appointment.paymentMethod
                            ? ` · ${appointment.paymentMethodRef?.name ?? appointment.paymentMethod}`
                            : ''
                        }`
                      : 'Unpaid'}
                  </p>
                </div>
                <Switch
                  checked={appointment.isPaid}
                  disabled={markPaidMutation.isPending || markUnpaidMutation.isPending}
                  onCheckedChange={handleTogglePaid}
                />
              </div>
              {!appointment.isPaid && (
                <div className="space-y-1.5">
                  <Label>Payment method</Label>
                  <Select value={payMethodId || NONE} onValueChange={(v) => setPayMethodId(v === NONE ? '' : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Select method</SelectItem>
                      {activePayMethods.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            maxLength={1000}
            placeholder="Optional notes..."
            className="resize-none"
            {...register('notes')}
          />
          {errors.notes?.message && (
            <p className="mt-1 text-xs text-destructive">{errors.notes.message}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <ButtonSpinner />}
          {isEdit ? 'Save Changes' : 'Create Appointment'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="space-y-1.5">
        <Label>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {children}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(muted && 'text-muted-foreground')}>{value}</span>
    </div>
  );
}

function ModeButton({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        active ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:bg-muted',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ToggleSeg({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-w-11 px-3 text-sm font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
      )}
    >
      {label}
    </button>
  );
}
