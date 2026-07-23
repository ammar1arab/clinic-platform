'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  MoreHorizontal,
  Trash2,
  UserCheck,
  UserX,
  Star,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/primitives/spinner';
import { FluidSkeletonStack } from '@/components/ui/fluid';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/blocks/feedback';
import { usePatient, useTogglePatientStatus, useDeletePatient } from '@/hooks/use-patients';
import { useDownloadPatientReport } from '@/hooks/use-reports';
import { useClinicId } from '@/hooks/use-clinic-id';
import { PatientReferralsBlock } from '@/components/blocks/patients/patient-referrals';
import { PatientTimelineBlock } from '@/components/blocks/patients/patient-timeline';
import { GENDERS } from '@/constants/patient';
import { format } from 'date-fns';
import type { ReportFormat } from '@/services/reports.service';

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function InfoField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate" title={value ?? undefined}>
        {value?.trim() ? value : '—'}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const clinicId = useClinicId();
  const { data: patient, isLoading } = usePatient(id);
  const toggleStatus = useTogglePatientStatus(clinicId);
  const deleteMutation = useDeletePatient(clinicId);
  const downloadReport = useDownloadPatientReport(clinicId);

  const del = useTwoStepDelete<{ id: string; name: string }>();

  const handleDownload = (format: ReportFormat) => {
    downloadReport.mutate({ patientId: id, format });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <FluidSkeletonStack
          count={4}
          itemClassName="h-24 first:h-36 last:h-48 rounded-xl"
        />
      </div>
    );
  }
  if (!patient) {
    return <EmptyState title="Patient not found" description="This record may have been removed." />;
  }

  const fullName = `${patient.firstNameEn} ${patient.lastNameEn}`.trim();
  const inits =
    `${patient.firstNameEn?.[0] ?? ''}${patient.lastNameEn?.[0] ?? ''}`.toUpperCase() || '?';
  const genderLabel = GENDERS.find((g) => g.value === patient.gender)?.label ?? patient.gender;
  const dobText = patient.dob
    ? `${format(new Date(patient.dob), 'MMM d, yyyy')} (${calcAge(patient.dob)} yrs)`
    : null;
  const isLoyal = patient.appointments.filter((a) => a.status === 'completed').length >= 10;

  const firstVisit = patient.appointments.at(-1)?.scheduledAt;
  const lastVisit = patient.appointments.at(0)?.scheduledAt;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => router.push('/patients')}
        >
          <ArrowLeft className="size-4 mr-1.5" />
          Back to Patients
        </Button>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={downloadReport.isPending}>
                {downloadReport.isPending ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : (
                  <FileDown className="size-4 mr-1.5" />
                )}
                Download report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handleDownload('pdf')}>PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('docx')}>Word</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('xlsx')}>Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('csv')}>CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/patients/${patient.id}/edit`}>
              <Pencil className="size-4 mr-1.5" />
              Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="More actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() =>
                  toggleStatus.mutate({ id: patient.id, isActive: !patient.isActive })
                }
                disabled={toggleStatus.isPending}
              >
                {patient.isActive ? (
                  <>
                    <UserX className="size-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="size-4" />
                    Reactivate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => del.ask({ id: patient.id, name: fullName })}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Avatar size="lg">
              <AvatarFallback className="text-base font-medium">{inits}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <CardTitle className="min-w-0 truncate text-lg">{fullName}</CardTitle>
                {isLoyal && <Star className="size-4 shrink-0 fill-warning text-warning" />}
              </div>
            </div>
            <Badge variant={patient.isActive ? 'default' : 'secondary'} className="shrink-0">
              {patient.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center rounded-lg bg-muted/40 py-3">
            <Stat label="Sessions" value={String(patient.appointments.length)} />
            <Separator orientation="vertical" className="h-8" />
            <Stat
              label="First Visit"
              value={firstVisit ? format(new Date(firstVisit), 'MMM yyyy') : '—'}
            />
            <Separator orientation="vertical" className="h-8" />
            <Stat
              label="Last Visit"
              value={lastVisit ? format(new Date(lastVisit), 'MMM yyyy') : '—'}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <InfoField label="Phone" value={patient.phone} />
            <InfoField label="Email" value={patient.email} />
            <InfoField label="National ID" value={patient.nationalId} />
            <InfoField label="Date of Birth" value={dobText} />
            <InfoField label="Gender" value={genderLabel ?? null} />
            <InfoField label="Blood Type" value={patient.bloodType} />
            <InfoField label="Emergency Contact" value={patient.emergencyContactName} />
            <InfoField label="Emergency Phone" value={patient.emergencyContactPhone} />
            <InfoField label="Allergies" value={patient.allergies} />
            <div className="min-w-0 space-y-0.5 sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-muted-foreground">Address</p>
              <p>{patient.address?.trim() ? patient.address : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PatientTimelineBlock
        appointments={patient.appointments}
        referrals={patient.referrals}
      />

      <PatientReferralsBlock
        clinicId={clinicId}
        patientId={patient.id}
        appointments={patient.appointments}
      />

      <TwoStepDeleteDialogs
        step1={del.step1}
        step2={del.step2}
        onStep1OpenChange={(open) => !open && del.cancelStep1()}
        onStep2OpenChange={(open) => !open && del.cancelStep2()}
        onContinue={del.advance}
        onConfirm={() => {
          if (!del.step2) return;
          deleteMutation.mutate(del.step2.id, {
            onSuccess: () => {
              del.clear();
              router.push('/patients');
            },
          });
        }}
        isPending={deleteMutation.isPending}
        warning="This permanently removes the patient and their visit history. This cannot be undone. To just hide the patient, use Deactivate instead."
        finalWarning="This permanently deletes the patient and every appointment linked to them. This action cannot be undone."
        confirmLabel="Yes, delete patient"
      />
    </div>
  );
}
