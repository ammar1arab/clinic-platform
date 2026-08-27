'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/components/ui';
import {
  ContactLine,
  EmailLink,
  PhoneLink,
  EmptyState,
  PreviewableAvatar,
  SectionLoader,
  RowActionsMenu,
} from '@/components/primitives';
import {
  TwoStepDeleteDialogs,
  useTwoStepDelete,
} from '@/components/blocks/feedback';
import { ExportFormatButton } from '@/components/blocks/reports';
import { PatientReferralsBlock } from './patient-referrals';
import { PatientTimelineBlock } from './patient-timeline';
import {
  ProfileHero,
  ProfileInfoField,
  ProfileInfoGrid,
  ProfileSection,
  ProfileShell,
  ProfileStatusBadge,
} from '@/components/blocks/profile';
import { GENDERS } from '@/constants/patient';
import { ROUTES } from '@/constants/routes';
import {
  IconActivate,
  IconDeactivate,
  IconDelete,
  IconEdit,
  IconLoyal,
  IconPerson,
} from '@/constants/icons';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import {
  useDeletePatient,
  usePatient,
  useTogglePatientStatus,
} from '@/hooks/api/use-patients';
import { useDownloadPatientReport } from '@/hooks/api/use-reports';
import { calcAge } from '@/lib/age';

export function PatientProfile({ patientId }: { patientId: string }) {
  const router = useRouter();
  const clinicId = useClinicId();
  const { data: patient, isLoading } = usePatient(patientId);
  const toggleStatus = useTogglePatientStatus(clinicId);
  const deleteMutation = useDeletePatient(clinicId);
  const downloadReport = useDownloadPatientReport(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  if (isLoading) return <SectionLoader label="Loading patient…" />;
  if (!patient) {
    return (
      <EmptyState
        icon={IconPerson}
        title="Patient not found"
        description="This record may have been removed."
      />
    );
  }

  const fullName = `${patient.firstNameEn} ${patient.lastNameEn}`.trim();
  const genderLabel =
    GENDERS.find((g) => g.value === patient.gender)?.label ?? patient.gender;
  const age = calcAge(patient.dob);
  const dobText = patient.dob
    ? `${format(new Date(patient.dob), 'MMM d, yyyy')}${
        age != null ? ` (${age} yrs)` : ''
      }`
    : null;
  const isLoyal =
    patient.appointments.filter((a) => a.status === 'completed').length >= 10;
  const firstVisit = patient.appointments.at(-1)?.scheduledAt;
  const lastVisit = patient.appointments.at(0)?.scheduledAt;

  return (
    <ProfileShell
      backHref={ROUTES.PATIENTS}
      backLabel="Back to Patients"
      actions={
        <div className="flex items-center gap-2">
          <ExportFormatButton
            pending={downloadReport.isPending}
            onSelect={(reportFormat) =>
              downloadReport.mutate({ patientId, format: reportFormat })
            }
          />
          <RowActionsMenu
            items={[
              {
                label: 'Edit',
                icon: IconEdit,
                href: `${ROUTES.PATIENT_DETAIL(patient.id)}/edit`,
              },
              {
                label: patient.isActive ? 'Deactivate' : 'Reactivate',
                icon: patient.isActive ? IconDeactivate : IconActivate,
                disabled: toggleStatus.isPending,
                onSelect: () =>
                  toggleStatus.mutate({
                    id: patient.id,
                    isActive: !patient.isActive,
                  }),
              },
              {
                label: 'Delete',
                icon: IconDelete,
                variant: 'destructive',
                onSelect: () => del.ask({ id: patient.id, name: fullName }),
              },
            ]}
          />
        </div>
      }
    >
      <ProfileHero
        avatar={
          <PreviewableAvatar
            src={patient.imageUrl}
            seed={patient.id}
            alt={fullName}
            size="xl"
            priority
          />
        }
        title={fullName}
        titleExtra={
          isLoyal ? (
            <IconLoyal className="size-4 shrink-0 fill-warning text-warning" />
          ) : null
        }
        badges={<ProfileStatusBadge active={patient.isActive} />}
        meta={<ContactLine phone={patient.phone} email={patient.email} />}
        stats={[
          {
            label: 'Sessions',
            value: String(patient.appointments.length),
          },
          {
            label: 'First visit',
            value: firstVisit
              ? format(new Date(firstVisit), 'MMM yyyy')
              : '—',
          },
          {
            label: 'Last visit',
            value: lastVisit ? format(new Date(lastVisit), 'MMM yyyy') : '—',
          },
        ]}
      />

      <ProfileSection title="Details">
        <ProfileInfoGrid className="lg:grid-cols-3">
          {patient.phone ? (
            <ProfileInfoField label="Phone" value={patient.phone}>
              <PhoneLink value={patient.phone} className="text-sm font-medium" />
            </ProfileInfoField>
          ) : null}
          {patient.email ? (
            <ProfileInfoField label="Email" value={patient.email}>
              <EmailLink value={patient.email} className="text-sm font-medium" />
            </ProfileInfoField>
          ) : null}
          <ProfileInfoField label="National ID" value={patient.nationalId} />
          <ProfileInfoField label="Date of birth" value={dobText} />
          <ProfileInfoField label="Gender" value={genderLabel ?? null}>
            {genderLabel ? (
              <Badge
                variant={genderLabel.toLowerCase() === 'female' ? 'warning' : 'info'}
                className="font-normal"
              >
                {genderLabel}
              </Badge>
            ) : null}
          </ProfileInfoField>
          <ProfileInfoField label="Blood type" value={patient.bloodType}>
            {patient.bloodType ? (
              <Badge
                variant={patient.bloodType.endsWith('-') ? 'warning' : 'success'}
                className="font-normal"
              >
                {patient.bloodType}
              </Badge>
            ) : null}
          </ProfileInfoField>
          <ProfileInfoField
            label="Emergency contact"
            value={patient.emergencyContactName}
          />
          {patient.emergencyContactPhone ? (
            <ProfileInfoField
              label="Emergency phone"
              value={patient.emergencyContactPhone}
            >
              <PhoneLink
                value={patient.emergencyContactPhone}
                className="text-sm font-medium"
              />
            </ProfileInfoField>
          ) : null}
          <ProfileInfoField label="Address" value={patient.address} />
          <ProfileInfoField
            label="Allergies"
            value={patient.allergies}
            className="sm:col-span-2 lg:col-span-3"
          />
        </ProfileInfoGrid>
      </ProfileSection>

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
              router.push(ROUTES.PATIENTS);
            },
          });
        }}
        isPending={deleteMutation.isPending}
        warning="This permanently removes the patient and their visit history. This cannot be undone. To just hide the patient, use Deactivate instead."
        finalWarning="This permanently deletes the patient and every appointment linked to them. This action cannot be undone."
        confirmLabel="Yes, delete patient"
      />
    </ProfileShell>
  );
}
