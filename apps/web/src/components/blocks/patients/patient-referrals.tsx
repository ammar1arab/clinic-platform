'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/primitives/spinner';
import { ButtonSpinner } from '@/components/blocks/feedback/button-spinner';
import { useAuth } from '@/providers';
import { useClinicStaff } from '@/hooks/use-clinic-staff';
import {
  useAcceptReferral,
  useCreateReferral,
  useRejectReferral,
  useReferralOpinion,
  useReferrals,
} from '@/hooks/use-referrals';
import type { ReferralType, ReferralUrgency } from '@/services/referrals.service';

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

const URGENCY_VARIANT: Record<ReferralUrgency, 'outline' | 'secondary' | 'destructive'> = {
  normal: 'outline',
  high: 'secondary',
  urgent: 'destructive',
};

export function PatientReferralsBlock({ clinicId, patientId, appointments }: Props) {
  const { user } = useAuth();
  const clinicUserId = user?.clinicUserId ?? '';
  const { data: referrals } = useReferrals({ clinicId, patientId });
  const { data: staff } = useClinicStaff(clinicId);
  const createMutation = useCreateReferral(clinicId);
  const acceptMutation = useAcceptReferral(clinicId);
  const rejectMutation = useRejectReferral(clinicId);
  const opinionMutation = useReferralOpinion(clinicId);

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Referrals & consults</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openCreate}
              disabled={appointments.length === 0}
            >
              <Plus className="size-4 mr-1.5" />
              New request
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {!referrals?.length && (
            <EmptyState
              title="No referrals yet"
              description="Send a referral or consultation from an existing appointment."
              className="py-8"
            />
          )}
          {referrals?.map((ref) => {
            const isReceiver = ref.toDoctorId === clinicUserId;
            const canAct = isReceiver && ref.status === 'pending';
            const canOpinion =
              isReceiver && ref.status === 'accepted' && ref.type === 'consultation';

            return (
              <div key={ref.id} className="space-y-2 border-b py-3 text-sm last:border-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-medium capitalize">{ref.type}</p>
                      <Badge variant={URGENCY_VARIANT[ref.urgency]} className="capitalize">
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
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ref.createdAt), 'MMM d, yyyy · h:mm a')} ·{' '}
                      {ref.fromDoctor?.name ?? 'Doctor'} → {ref.toDoctor?.name ?? 'Doctor'}
                    </p>
                    {ref.appointment?.scheduledAt && (
                      <p className="text-xs text-muted-foreground">
                        Visit{' '}
                        {format(new Date(ref.appointment.scheduledAt), 'MMM d, yyyy · h:mm a')}
                      </p>
                    )}
                  </div>
                  {canAct && (
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                        onClick={() => acceptMutation.mutate(ref.id)}
                      >
                        <Check className="size-3.5 mr-1" />
                        Accept
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                        onClick={() => rejectMutation.mutate(ref.id)}
                      >
                        <X className="size-3.5 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground">{ref.reason}</p>
                {ref.opinion && (
                  <p className="rounded-md bg-muted/50 px-2.5 py-2 text-xs">
                    <span className="font-medium text-foreground">Opinion: </span>
                    {ref.opinion}
                  </p>
                )}
                {canOpinion && !ref.opinion && (
                  <div className="space-y-2">
                    <Textarea
                      rows={2}
                      placeholder="Add your consultation opinion…"
                      value={opinionDrafts[ref.id] ?? ''}
                      onChange={(e) =>
                        setOpinionDrafts((prev) => ({ ...prev, [ref.id]: e.target.value }))
                      }
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        opinionMutation.isPending || !(opinionDrafts[ref.id] ?? '').trim()
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
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New referral / consult</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Appointment</Label>
              <Select value={appointmentId} onValueChange={setAppointmentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select appointment" />
                </SelectTrigger>
                <SelectContent>
                  {appointments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {format(new Date(a.scheduledAt), 'MMM d, yyyy · h:mm a')} ·{' '}
                      {a.service?.name ?? 'Visit'} · Dr. {a.doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>To doctor</Label>
              <Select value={toDoctorId} onValueChange={setToDoctorId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {otherDoctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as ReferralType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Urgency</Label>
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
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you referring or requesting a consult?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                createMutation.isPending ||
                !appointmentId ||
                !toDoctorId ||
                !reason.trim()
              }
              onClick={handleCreate}
            >
              {createMutation.isPending && <ButtonSpinner />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
