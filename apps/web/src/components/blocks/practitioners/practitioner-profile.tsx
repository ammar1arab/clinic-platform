'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/components/ui';
import {
  languageLabelList,
  LANGUAGE_BADGE_VARIANT,
  PRACTITIONER_EMPLOYMENT_LABEL,
  PRACTITIONER_EMPLOYMENT_VARIANT,
  WEEKDAY_OPTIONS,
} from '@/constants/practitioner';
import {
  countryLabel,
  ContactLine,
  PhoneLink,
  PreviewableAvatar,
  RowActionsMenu,
} from '@/components/primitives';
import { GENDERS } from '@/constants/patient';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/blocks/feedback';
import {
  ProfileEmpty,
  ProfileHero,
  ProfileInfoField,
  ProfileInfoGrid,
  ProfileSection,
  ProfileShell,
  ProfileSoftRow,
  ProfileStatusBadge,
} from '@/components/blocks/profile';
import { ROUTES } from '@/constants/routes';
import {
  useDeletePractitioner,
  useDeactivatePractitioner,
  useReactivatePractitioner,
} from '@/hooks/api/use-practitioners';
import { calcAge } from '@/lib/age';
import { formatDate, formatTimeRange } from '@/lib/datetime';
import type { PractitionerDetail } from '@/services/practitioners.service';
import { IconActivate, IconDeactivate, IconDelete, IconEdit } from '@/constants/icons';

function employmentLabel(type: string | null | undefined) {
  if (!type) return null;
  return PRACTITIONER_EMPLOYMENT_LABEL[type] ?? type;
}

export function PractitionerProfile({
  practitioner,
  clinicId,
}: {
  practitioner: PractitionerDetail;
  clinicId: string;
}) {
  const router = useRouter();
  const deactivate = useDeactivatePractitioner(clinicId);
  const reactivate = useReactivatePractitioner(clinicId);
  const remove = useDeletePractitioner(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const toggling = deactivate.isPending || reactivate.isPending;
  const titleName = practitioner.title
    ? `${practitioner.title} ${practitioner.name}`
    : practitioner.name;
  const nationality = countryLabel(practitioner.nationality);
  const employment = employmentLabel(practitioner.employmentType);
  const languages = languageLabelList(practitioner.languages);
  const genderLabel =
    GENDERS.find((g) => g.value === practitioner.gender)?.label ?? practitioner.gender;
  const age = calcAge(practitioner.dob);
  const dobText = practitioner.dob
    ? `${format(new Date(practitioner.dob), 'MMM d, yyyy')}${age != null ? ` (${age} yrs)` : ''}`
    : null;

  return (
    <ProfileShell
      backHref={ROUTES.PRACTITIONERS}
      backLabel="Back to Practitioners"
      actions={
        <RowActionsMenu
          items={[
            {
              label: 'Edit',
              icon: IconEdit,
              href: ROUTES.PRACTITIONERS_EDIT(practitioner.id),
            },
            {
              label: practitioner.isActive ? 'Deactivate' : 'Reactivate',
              icon: practitioner.isActive ? IconDeactivate : IconActivate,
              disabled: toggling,
              onSelect: () =>
                practitioner.isActive
                  ? deactivate.mutate(practitioner.id)
                  : reactivate.mutate(practitioner.id),
            },
            {
              label: 'Delete',
              icon: IconDelete,
              variant: 'destructive',
              onSelect: () => del.ask({ id: practitioner.id, name: titleName }),
            },
          ]}
        />
      }
    >
      <ProfileHero
        avatar={
          <PreviewableAvatar
            src={practitioner.imageUrl}
            seed={practitioner.id}
            alt={practitioner.name}
            size="xl"
            priority
          />
        }
        title={titleName}
        badges={
          <>
            <ProfileStatusBadge active={practitioner.isActive} />
            {employment && practitioner.employmentType ? (
              <Badge
                variant={PRACTITIONER_EMPLOYMENT_VARIANT[practitioner.employmentType] ?? 'secondary'}
                className="font-normal"
              >
                {employment}
              </Badge>
            ) : null}
          </>
        }
        subtitle={practitioner.specialty ? <p>{practitioner.specialty}</p> : null}
        meta={<ContactLine phone={practitioner.phone} email={practitioner.email} />}
        stats={[
          {
            label: 'Services',
            value: String(practitioner.services.length),
          },
          {
            label: 'Buffer',
            value: `${practitioner.bufferMins}m`,
          },
          {
            label: 'Experience',
            value:
              practitioner.experienceYears != null ? `${practitioner.experienceYears} yrs` : '—',
          },
        ]}
      />

      <ProfileSection title="Overview">
        <ProfileInfoGrid className="lg:grid-cols-3">
          <ProfileInfoField label="Specialty" value={practitioner.specialty} />
          <ProfileInfoField label="Department" value={practitioner.departmentName} />
          <ProfileInfoField label="Default room" value={practitioner.defaultRoomName} />
          <ProfileInfoField label="Employment" value={employment}>
            {employment && practitioner.employmentType ? (
              <Badge
                variant={
                  PRACTITIONER_EMPLOYMENT_VARIANT[practitioner.employmentType] ?? 'secondary'
                }
                className="font-normal"
              >
                {employment}
              </Badge>
            ) : null}
          </ProfileInfoField>
          <ProfileInfoField
            label="Commission"
            value={
              practitioner.commissionPercent != null ? `${practitioner.commissionPercent}%` : null
            }
          />
          <ProfileInfoField label="Nationality" value={nationality}>
            {nationality ? (
              <Badge variant="info" className="font-normal">
                {nationality}
              </Badge>
            ) : null}
          </ProfileInfoField>
          <ProfileInfoField label="Gender" value={genderLabel}>
            {genderLabel ? (
              <Badge
                variant={genderLabel.toLowerCase() === 'female' ? 'warning' : 'info'}
                className="font-normal"
              >
                {genderLabel}
              </Badge>
            ) : null}
          </ProfileInfoField>
          <ProfileInfoField label="Date of birth" value={dobText} />
          {languages.length > 0 ? (
            <ProfileInfoField label="Languages" value={languages.join(', ')}>
              <div className="flex flex-wrap justify-end gap-1 sm:justify-start">
                {languages.map((label, index) => (
                  <Badge
                    key={label}
                    variant={LANGUAGE_BADGE_VARIANT[index % LANGUAGE_BADGE_VARIANT.length]}
                    className="font-normal"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </ProfileInfoField>
          ) : null}
          {practitioner.whatsapp ? (
            <ProfileInfoField label="WhatsApp" value={practitioner.whatsapp}>
              <PhoneLink value={practitioner.whatsapp} className="text-sm font-medium" />
            </ProfileInfoField>
          ) : null}
          <ProfileInfoField label="License" value={practitioner.licenseNumber} />
          <ProfileInfoField
            label="License expiry"
            value={
              practitioner.licenseExpiry
                ? format(new Date(practitioner.licenseExpiry), 'MMM d, yyyy')
                : null
            }
          />
          <ProfileInfoField
            label="Joined"
            value={format(new Date(practitioner.createdAt), 'MMM d, yyyy')}
          />
        </ProfileInfoGrid>
      </ProfileSection>

      {practitioner.bio?.trim() ? (
        <ProfileSection title="Bio">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {practitioner.bio}
          </p>
        </ProfileSection>
      ) : null}

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <ProfileSection
          title="Services"
          description={
            practitioner.services.length ? `${practitioner.services.length} assigned` : undefined
          }
          className="h-full"
        >
          {practitioner.services.length === 0 ? (
            <ProfileEmpty>No services assigned.</ProfileEmpty>
          ) : (
            <ul className="space-y-1.5">
              {practitioner.services.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 truncate font-medium">{s.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {s.durationMins}m
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ProfileSection>

        <ProfileSection title="Weekly availability" className="h-full">
          {practitioner.availabilities.length === 0 ? (
            <ProfileEmpty>No weekly patterns.</ProfileEmpty>
          ) : (
            <div className="space-y-1.5">
              {practitioner.availabilities.map((slot, index) => (
                <ProfileSoftRow
                  key={slot.id ?? `${slot.dayOfWeek}-${index}`}
                  title={WEEKDAY_OPTIONS[slot.dayOfWeek] ?? `Day ${slot.dayOfWeek}`}
                >
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatTimeRange(slot.startTime, slot.endTime)}
                  </span>
                </ProfileSoftRow>
              ))}
            </div>
          )}
        </ProfileSection>

        <ProfileSection title="Leave" className="h-full">
          {practitioner.timeOffs.length === 0 ? (
            <ProfileEmpty>No leave blocks.</ProfileEmpty>
          ) : (
            <div className="space-y-1.5">
              {practitioner.timeOffs.map((block, index) => (
                <ProfileSoftRow
                  key={block.id ?? `${block.startDate}-${index}`}
                  title={`${formatDate(block.startDate)} - ${formatDate(block.endDate)}`}
                  detail={block.reason}
                />
              ))}
            </div>
          )}
        </ProfileSection>
      </div>

      <TwoStepDeleteDialogs
        step1={del.step1}
        step2={del.step2}
        onStep1OpenChange={(open) => !open && del.cancelStep1()}
        onStep2OpenChange={(open) => !open && del.cancelStep2()}
        onContinue={del.advance}
        onConfirm={() => {
          if (!del.step2) return;
          remove.mutate(del.step2.id, {
            onSuccess: () => {
              del.clear();
              router.push(ROUTES.PRACTITIONERS);
            },
          });
        }}
        isPending={remove.isPending}
        warning="This permanently removes the practitioner, their schedule, and their appointments. This cannot be undone. To just hide them, use Deactivate instead."
        finalWarning="This permanently deletes the practitioner and every appointment assigned to them. This action cannot be undone."
        confirmLabel="Yes, delete practitioner"
      />
    </ProfileShell>
  );
}
