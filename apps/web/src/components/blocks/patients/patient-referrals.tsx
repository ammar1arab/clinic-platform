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
import {
  EmptyState,
  FormField,
  FormActions,
} from '@/components/primitives';
import { ButtonSpinner } from '@/components/primitives';;
import {  ProfileSection  } from '@/components/primitives';
import { useAuth } from '@/providers';
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
      {
        clinicId,
        appointmentId,
        toDoctorId,
        type,
        urgency,
        reason: reason.trim(),
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <>
      <ProfileSection
        title="Referrals & consults"
        description="Cross-doctor requests for this patient"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={openCreate}
            disabled={appointments.length === 0}
          >
            <IconAdd className="mr-1.5 size-4" />
            New request
          </Button>
        }
      >
        {!referrals?.length ? (
          <EmptyState
            title="No referrals yet"
            description="Send a referral or consultation from an existing appointment."
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
                      <p className="break-words text-xs text-muted-foreground">
                        {formatDateTime(ref.createdAt)}
                        <br />
                        {ref.fromDoctor?.name ?? 'Doctor'} →{' '}
                        {ref.toDoctor?.name ?? 'Doctor'}
                      </p>
                      {ref.appointment?.scheduledAt ? (
                        <p className="break-words text-xs text-muted-foreground">
                          Visit {formatDateTime(ref.appointment.scheduledAt)}
                        </p>
                      ) : null}
                    </div>
                    {canAct ? (
                      <div className="flex shrink-0 gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            acceptMutation.isPending || rejectMutation.isPending
                          }
                          onClick={() => acceptMutation.mutate(ref.id)}
                        >
                          <IconCheck className="mr-1 size-3.5" />
                          Accept
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            acceptMutation.isPending || rejectMutation.isPending
                          }
                          onClick={() => rejectMutation.mutate(ref.id)}
                        >
                          <IconClose className="mr-1 size-3.5" />
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <p className="break-words whitespace-pre-wrap text-muted-foreground">
                    {ref.reason}
                  </p>
                  {ref.opinion ? (
                    <p className="break-words rounded-lg bg-background/70 px-2.5 py-2 text-xs whitespace-pre-wrap ring-1 ring-border/50">
                      <span className="font-medium text-foreground">
                        Opinion:{' '}
                      </span>
                      {ref.opinion}
                    </p>
                  ) : null}
                  {canOpinion && !ref.opinion ? (
                    <div className="space-y-2">
                      <Textarea
                        rows={2}
                        placeholder="Add your consultation opinion…"
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
                        Save opinion
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New referral / consult</DialogTitle>
          </DialogHeader>
          <div className="min-w-0 space-y-3">
            <FormField label="Appointment">
              <Select value={appointmentId} onValueChange={setAppointmentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select appointment" />
                </SelectTrigger>
                <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                  {appointments.map((a) => (
                    <SelectItem key={a.id} value={a.id} textValue={`${formatDateTime(a.scheduledAt)} ${a.service?.name ?? 'Visit'} ${a.doctor.name}`}>
                      <span className="flex min-w-0 flex-col gap-0.5 text-left leading-snug">
                        <span className="font-medium">
                          {formatDateTime(a.scheduledAt)}
                        </span>
                        <span className="text-xs text-muted-foreground break-words whitespace-normal">
                          {a.service?.name ?? 'Visit'} · Dr. {a.doctor.name}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="To doctor">
              <Select value={toDoctorId} onValueChange={setToDoctorId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                  {otherDoctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="break-words whitespace-normal">{d.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
              <FormField label="Type">
                <Select value={type} onValueChange={(v) => setType(v as ReferralType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Urgency">
                <Select value={urgency} onValueChange={(v) => setUrgency(v as ReferralUrgency)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Reason" required>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you referring or requesting a consult?"
                className="min-w-0 resize-y"
              />
            </FormField>
          </div>
          <DialogFooter>
            <FormActions
              variant="dialog"
              onCancel={() => setOpen(false)}
              submitLabel="Send"
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
