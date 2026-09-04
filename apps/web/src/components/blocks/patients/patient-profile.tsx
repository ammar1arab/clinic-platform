'use client';

import { useRouter } from 'next/navigation';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/primitives';
import { format } from 'date-fns';
import { Badge } from '@/components/ui';
import {
  ContactLine, EmailLink, PhoneLink, EmptyState, PreviewableAvatar, SectionLoader, RowActionsMenu,
  ProfileHero, ProfileInfoField, ProfileInfoGrid, ProfileSection, ProfileShell, ProfileStatusBadge,
} from '@/components/primitives';
import { ExportFormatButton } from '@/components/blocks/reports';
import { PatientReferralsBlock } from './patient-referrals';
import { PatientTimelineBlock } from './patient-timeline';
import { genderLabel } from '@/constants/patient';
import { ROUTES } from '@/constants/routes';
import {
  IconActivate, IconDeactivate, IconDelete, IconEdit, IconLoyal, IconPerson,
} from '@/constants/icons';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useDeletePatient, usePatient, useTogglePatientStatus } from '@/hooks/api/use-patients';
import { useDownloadPatientReport } from '@/hooks/api/use-reports';
import { calcAge } from '@/lib/age';
import { useLanguage } from '@/providers';

export function PatientProfile({ patientId }: { patientId: string }) {
  const router = useRouter();
  const clinicId = useClinicId();
  const { t } = useLanguage();
  const { data: patient, isLoading } = usePatient(patientId);
  const toggleStatus = useTogglePatientStatus(clinicId);
  const deleteMutation = useDeletePatient(clinicId);
  const downloadReport = useDownloadPatientReport(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  if (isLoading) return <SectionLoader label={t?.common?.loading} />;
  if (!patient) {
    return (
      <EmptyState
        icon={IconPerson}
        title={t?.patient?.notFound}
        description={t?.patient?.notFoundDesc}
      />
    );
  }

  const fullName = `${patient.firstNameEn} ${patient.lastNameEn}`.trim();
  const genderLbl = genderLabel(patient.gender, t);
  const age = calcAge(patient.dob);
  const dobText = patient.dob
    ? `${format(new Date(patient.dob), 'MMM d, yyyy')}${
        age != null ? ` (${age} ${(t?.patient as any)?.yrs})` : ''
      }`
    : null;
  const isLoyal =
    patient.appointments.filter((a) => a.status === 'completed').length >= 10;
  const firstVisit = patient.appointments.at(-1)?.scheduledAt;
  const lastVisit = patient.appointments.at(0)?.scheduledAt;

  return (
    <ProfileShell
      backHref={ROUTES.PATIENTS}
      backLabel={t?.patient?.patients}
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
                label: t?.common?.edit,
                icon: IconEdit,
                href: `${ROUTES.PATIENT_DETAIL(patient.id)}/edit`,
              },
              {
                label: patient.isActive ? t?.common?.deactivate : t?.common?.reactivate,
                icon: patient.isActive ? IconDeactivate : IconActivate,
                disabled: toggleStatus.isPending,
                onSelect: () =>
                  toggleStatus.mutate({
                    id: patient.id,
                    isActive: !patient.isActive,
                  }),
              },
              {
                label: t?.common?.delete,
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
            label: t?.patient?.sessions,
            value: String(patient.appointments.length),
          },
          {
            label: t?.patient?.visitFrom,
            value: firstVisit
              ? format(new Date(firstVisit), 'MMM yyyy')
              : '—',
          },
          {
            label: t?.patient?.lastVisit,
            value: lastVisit ? format(new Date(lastVisit), 'MMM yyyy') : '—',
          },
        ]}
      />

      <ProfileSection title={t?.patient?.personalDetails}>
        <ProfileInfoGrid className="lg:grid-cols-3">
          {patient.phone ? (
            <ProfileInfoField label={t?.patient?.phone} value={patient.phone}>
              <PhoneLink value={patient.phone} className="text-sm font-medium" />
            </ProfileInfoField>
          ) : null}
          {patient.email ? (
            <ProfileInfoField label={t?.patient?.email} value={patient.email}>
              <EmailLink value={patient.email} className="text-sm font-medium" />
            </ProfileInfoField>
          ) : null}
          <ProfileInfoField label={t?.patient?.nationalId} value={patient.nationalId} />
          <ProfileInfoField label={t?.patient?.dateOfBirth} value={dobText} />
          <ProfileInfoField label={t?.common?.gender} value={genderLbl ?? null}>
            {genderLbl ? (
              <Badge
                variant={patient.gender?.toLowerCase() === 'female' ? 'warning' : 'info'}
                className="font-normal"
              >
                {genderLbl}
              </Badge>
            ) : null}
          </ProfileInfoField>
          <ProfileInfoField label={t?.patient?.bloodType} value={patient.bloodType}>
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
            label={t?.patient?.emergencyContact}
            value={patient.emergencyContactName}
          />
          {patient.emergencyContactPhone ? (
            <ProfileInfoField
              label={t?.patient?.emergencyContactPhone}
              value={patient.emergencyContactPhone}
            >
              <PhoneLink
                value={patient.emergencyContactPhone}
                className="text-sm font-medium"
              />
            </ProfileInfoField>
          ) : null}
          <ProfileInfoField label={t?.patient?.address} value={patient.address} />
          <ProfileInfoField
            label={t?.patient?.allergies}
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
        warning={t?.patient?.deleteWarning1}
        finalWarning={t?.patient?.deleteWarning2}
        confirmLabel={t?.patient?.deleteConfirm}
      />
    </ProfileShell>
  );
}
