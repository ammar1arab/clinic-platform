'use client';

import {
  useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/components/ui';
import {
  languageLabelList,
  LANGUAGE_BADGE_VARIANT,
  getPractitionerEmploymentLabels,
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
import { genderLabel } from '@/constants/patient';
import { TwoStepDeleteDialogs,
  useTwoStepDelete } from '@/components/primitives';;
import {
  ProfileEmpty,
  ProfileHero,
  ProfileInfoField,
  ProfileInfoGrid,
  ProfileSection,
  ProfileShell,
  ProfileSoftRow,
  ProfileStatusBadge
} from '@/components/primitives';;
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
import { useLanguage } from '@/providers';
import type { Translations } from '@/i18n';

function employmentLabel(type: string | null | undefined, t: Translations) {
  if (!type) return null;
  return (t.constants.employment as Record<string, string>)?.[type] ?? getPractitionerEmploymentLabels(t)[type] ?? type;
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
  const { t, lang } = useLanguage();

  const toggling = deactivate.isPending || reactivate.isPending;
  const titleName = practitioner.title
    ? `${practitioner.title} ${practitioner.name}`
    : practitioner.name;
  const nationality = practitioner.nationality
    ? countryLabel(practitioner.nationality, lang) ?? practitioner.nationality
    : null;
  const employment = employmentLabel(practitioner.employmentType, t);
  const languages = practitioner.languages
    .map((code) => (t.constants.languages as Record<string, string>)[code] ?? code)
    .filter(Boolean);
  const genderLbl = practitioner.gender
    ? (t.constants.gender as Record<string, string>)[practitioner.gender.toLowerCase()] ?? practitioner.gender
    : null;
  const dobText = practitioner.dob
    ? `${format(new Date(practitioner.dob), 'MMM d, yyyy')}${calcAge(practitioner.dob) != null ? ` (${calcAge(practitioner.dob)} yrs)` : ''}`
    : null;

  return (
    <ProfileShell
      backHref={ROUTES.PRACTITIONERS}
      backLabel={t.practitioner.backToPractitioners}
      actions={
        <RowActionsMenu
          items={[
            {
              label: t.practitioner.edit,
              icon: IconEdit,
              href: ROUTES.PRACTITIONERS_EDIT(practitioner.id),
            },
            {
              label: practitioner.isActive
                ? t.practitioner.deactivate
                : t.practitioner.reactivate,
              icon: practitioner.isActive ? IconDeactivate : IconActivate,
              disabled: toggling,
              onSelect: () =>
                practitioner.isActive
                  ? deactivate.mutate(practitioner.id)
                  : reactivate.mutate(practitioner.id),
            },
            {
              label: t.practitioner.delete,
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
            label: t.practitioner.services,
            value: String(practitioner.services.length),
          },
          {
            label: t.practitioner.bufferTime,
            value: `${practitioner.bufferMins}m`,
          },
          {
            label: t.practitioner.experience,
            value:
              practitioner.experienceYears != null ? `${practitioner.experienceYears} yrs` : '—',
          },
        ]}
      />

      <ProfileSection title={t.practitioner.overview}>
        <ProfileInfoGrid className="lg:grid-cols-3">
          <ProfileInfoField label={t.practitioner.specialty} value={practitioner.specialty} />
          <ProfileInfoField label={t.practitioner.department} value={practitioner.departmentName} />
          <ProfileInfoField label={t.practitioner.defaultRoom} value={practitioner.defaultRoomName} />
          <ProfileInfoField label={t.practitioner.employment} value={employment}>
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
            label={t.practitioner.commission}
            value={
              practitioner.commissionPercent != null ? `${practitioner.commissionPercent}%` : null
            }
          />
          <ProfileInfoField label={t.practitioner.nationality} value={nationality}>
            {nationality ? (
              <Badge variant="info" className="font-normal">
                {nationality}
              </Badge>
            ) : null}
          </ProfileInfoField>
          <ProfileInfoField label={t.common.gender} value={genderLbl}>
            {genderLbl ? (
              <Badge
                variant={practitioner.gender?.toLowerCase() === 'female' ? 'warning' : 'info'}
                className="font-normal"
              >
                {genderLbl}
              </Badge>
            ) : null}
          </ProfileInfoField>
          <ProfileInfoField label={t.practitioner.dob} value={dobText} />
          {languages.length > 0 ? (
            <ProfileInfoField label={t.practitioner.languages} value={languages.join(', ')}>
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
          <ProfileInfoField label={t.practitioner.licenseNumber} value={practitioner.licenseNumber} />
          <ProfileInfoField
            label={t.practitioner.licenseExpiry}
            value={
              practitioner.licenseExpiry
                ? format(new Date(practitioner.licenseExpiry), 'MMM d, yyyy')
                : null
            }
          />
          <ProfileInfoField
            label={t.practitioner.joined}
            value={format(new Date(practitioner.createdAt), 'MMM d, yyyy')}
          />
        </ProfileInfoGrid>
      </ProfileSection>

      {practitioner.bio?.trim() ? (
        <ProfileSection title={t.practitioner.bio}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {practitioner.bio}
          </p>
        </ProfileSection>
      ) : null}

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <ProfileSection
          title={t.practitioner.services}
          description={
            practitioner.services.length
              ? `${practitioner.services.length} ${t.practitioner.assigned}`
              : undefined
          }
          className="h-full"
        >
          {practitioner.services.length === 0 ? (
            <ProfileEmpty>{t.practitioner.noServicesAssigned}</ProfileEmpty>
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

        <ProfileSection title={t.practitioner.weeklyAvailability} className="h-full">
          {practitioner.availabilities.length === 0 ? (
            <ProfileEmpty>{t.practitioner.noWeeklyPatterns}</ProfileEmpty>
          ) : (
            <div className="space-y-1.5">
              {practitioner.availabilities.map((slot, index) => (
                <ProfileSoftRow
                  key={slot.id ?? `${slot.dayOfWeek}-${index}`}
                  title={t.constants.weekdays[WEEKDAY_OPTIONS[slot.dayOfWeek]] ?? WEEKDAY_OPTIONS[slot.dayOfWeek] ?? `Day ${slot.dayOfWeek}`}
                >
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatTimeRange(slot.startTime, slot.endTime)}
                  </span>
                </ProfileSoftRow>
              ))}
            </div>
          )}
        </ProfileSection>

        <ProfileSection title={t.practitioner.leave} className="h-full">
          {practitioner.timeOffs.length === 0 ? (
            <ProfileEmpty>{t.practitioner.noLeaveBlocks}</ProfileEmpty>
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
        warning={t.practitioner.deleteWarning1}
        finalWarning={t.practitioner.deleteWarning2}
        confirmLabel={t.practitioner.deleteConfirm}
      />
    </ProfileShell>
  );
}
