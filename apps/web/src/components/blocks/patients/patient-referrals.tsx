'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { EmptyState, FormField, FormActions, ButtonSpinner, ProfileSection } from '@/components/primitives';
import { useAuth, useLanguage } from '@/providers';
import { useClinicStaff } from '@/hooks/api/use-clinic-staff';
import {
  useAcceptReferral,
  useCreateReferral,
  useRejectReferral,
  useSaveOpinion,
  useReferrals,
} from '@/hooks/api/use-referrals';
import type { ReferralType, ReferralUrgency } from '@/services/referrals.service';
import { REFERRAL_URGENCY_VARIANT } from '@/constants/referral';
import { IconAdd, IconCheck, IconClose } from '@/constants/icons';
import { formatDateTime } from '@/lib/datetime';

interface AppointmentOption {
  id: string;
  scheduledAt: string;
  doctor: { name: string };
  service: { name: string } | null;
}

interface Props {
  clinicId: string;
  patientId: string;
  appointments: AppointmentOption[];
}

export function PatientReferralsBlock({ clinicId, patientId, appointments }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const clinicUserId = user?.clinicUserId ?? '';
  const { data: referrals } = useReferrals({ clinicId, patientId });
  const { data: staff } = useClinicStaff(clinicId);
  const createMutation = useCreateReferral(clinicId);
  const acceptMutation = useAcceptReferral(clinicId);
  const rejectMutation = useRejectReferral(clinicId);
  const opinionMutation = useSaveOpinion(clinicId);

  const [open, setOpen] = useState(false);
  const [appointmentId, setAppointmentId] = useState('');
  const [toDoctorId, setToDoctorId] = useState('');
  const [type, setType] = useState<ReferralType>('referral');
  const [urgency, setUrgency] = useState<ReferralUrgency>('normal');
  const [reason, setReason] = useState('');
  const [opinionDrafts, setOpinionDrafts] = useState<Record<string, string>>({});

  const otherDoctors = useMemo(
    () => (staff ?? []).filter((s) => s.id !== clinicUserId),
    [staff, clinicUserId],
  );

  const openCreate = () => {
    setAppointmentId(appointments[0]?.id ?? '');
    setToDoctorId('');
    setType('referral');
    setUrgency('normal');
    setReason('');
    setOpen(true);
  };

  const handleCreate = () => {
    if (!appointmentId || !toDoctorId || !reason.trim()) return;
    createMutation.mutate(
      { clinicId, appointmentId, toDoctorId, type, urgency, reason: reason.trim() },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <>
      <ProfileSection
        title={t?.referral?.referralsAndConsults}
        description={t?.referral?.crossDoctorRequests}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={openCreate}
            disabled={appointments.length === 0}
          >
            <IconAdd className="me-1.5 size-4" />
            {t?.referral?.newRequest}
          </Button>
        }
      >
        {!referrals?.length ? (
          <EmptyState
            title={t?.referral?.noReferrals}
            description={t?.referral?.noReferralsDesc}
            className="py-8"
          />
        ) : (
          <div className="space-y-2">
            {referrals.map((ref) => {
              const isReceiver = ref.toDoctorId === clinicUserId;
              const canAct = isReceiver && ref.status === 'pending';
              const canOpinion =
                isReceiver &&
                ref.status === 'accepted' &&
                ref.type === 'consultation';

              return (
                <div
                  key={ref.id}
                  className="min-w-0 space-y-2 rounded-xl bg-muted/35 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-medium capitalize">{ref.type}</p>
                        <Badge
                          variant={REFERRAL_URGENCY_VARIANT[ref.urgency]}
                          className="capitalize"
                        >
                          {ref.urgency}
                        </Badge>
                        <Badge
                          variant={
                            ref.status === 'accepted'
                              ? 'default'
                              : ref.status === 'rejected'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="capitalize"
                        >
                          {ref.status}
                        </Badge>
                      </div>
                      <p className="wrap-break-word text-xs text-muted-foreground">
                        {formatDateTime(ref.createdAt)}
                        <br />
                        {ref.fromDoctor?.name ?? t?.referral?.doctor} →{' '}
                        {ref.toDoctor?.name ?? t?.referral?.doctor}
                      </p>
                      {ref.appointment?.scheduledAt ? (
                        <p className="wrap-break-word text-xs text-muted-foreground">
                          {t?.referral?.visit} {formatDateTime(ref.appointment.scheduledAt)}
                        </p>
                      ) : null}
                    </div>
                    {canAct ? (
                      <div className="flex shrink-0 gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={acceptMutation.isPending || rejectMutation.isPending}
                          onClick={() => acceptMutation.mutate(ref.id)}
                        >
                          <IconCheck className="me-1 size-3.5" />
                          {t?.referral?.accept}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={acceptMutation.isPending || rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(ref.id)}
                        >
                          <IconClose className="me-1 size-3.5" />
                          {t?.referral?.reject}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <p className="wrap-break-word whitespace-pre-wrap text-muted-foreground">
                    {ref.reason}
                  </p>
                  {ref.opinion ? (
                    <p className="wrap-break-word rounded-lg bg-background/70 px-2.5 py-2 text-xs whitespace-pre-wrap ring-1 ring-border/50">
                      <span className="font-medium text-foreground">
                        {t?.referral?.opinion}:{' '}
                      </span>
                      {ref.opinion}
                    </p>
                  ) : null}
                  {canOpinion && !ref.opinion ? (
                    <div className="space-y-2">
                      <Textarea
                        rows={2}
                        placeholder={t?.referral?.addOpinionPlaceholder}
                        value={opinionDrafts[ref.id] ?? ''}
                        onChange={(e) =>
                          setOpinionDrafts((prev) => ({
                            ...prev,
                            [ref.id]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          opinionMutation.isPending ||
                          !(opinionDrafts[ref.id] ?? '').trim()
                        }
                        onClick={() =>
                          opinionMutation.mutate({
                            id: ref.id,
                            opinion: (opinionDrafts[ref.id] ?? '').trim(),
                          })
                        }
                      >
                        {opinionMutation.isPending && <ButtonSpinner />}
                        {t?.referral?.saveOpinion}
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </ProfileSection>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" preventClose>
          <DialogHeader>
            <DialogTitle>{t?.referral?.newReferralConsult}</DialogTitle>
          </DialogHeader>
          <div className="min-w-0 space-y-3">
            <FormField label={t?.referral?.appointment}>
              <Select value={appointmentId} onValueChange={setAppointmentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t?.referral?.selectAppointment} />
                </SelectTrigger>
                <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                  {appointments.map((a) => (
                    <SelectItem key={a.id} value={a.id} textValue={`${formatDateTime(a.scheduledAt)} ${a.service?.name ?? t?.referral?.visit} ${a.doctor.name}`}>
                      <span className="flex min-w-0 flex-col gap-0.5 text-start leading-snug">
                        <span className="font-medium">
                          {formatDateTime(a.scheduledAt)}
                        </span>
                        <span className="text-xs text-muted-foreground wrap-break-word whitespace-normal">
                          {a.service?.name ?? t?.referral?.visit} · Dr. {a.doctor.name}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t?.referral?.toDoctor}>
              <Select value={toDoctorId} onValueChange={setToDoctorId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t?.referral?.selectDoctor} />
                </SelectTrigger>
                <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                  {otherDoctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="wrap-break-word whitespace-normal">{d.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
              <FormField label={t?.referral?.type}>
                <Select value={type} onValueChange={(v) => setType(v as ReferralType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">{t?.referral?.referral}</SelectItem>
                    <SelectItem value="consultation">{t?.referral?.consultation}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label={t?.referral?.urgency}>
                <Select value={urgency} onValueChange={(v) => setUrgency(v as ReferralUrgency)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">{t?.referral?.normal}</SelectItem>
                    <SelectItem value="high">{t?.referral?.high}</SelectItem>
                    <SelectItem value="urgent">{t?.referral?.urgent}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label={t?.referral?.reason} required>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t?.referral?.reasonPlaceholder}
                className="min-w-0 resize-y"
              />
            </FormField>
          </div>
          <DialogFooter>
            <FormActions
              variant="dialog"
              onCancel={() => setOpen(false)}
              submitLabel={t?.common?.save}
              pending={createMutation.isPending}
              disabled={!appointmentId || !toDoctorId || !reason.trim()}
              onSubmitClick={handleCreate}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
