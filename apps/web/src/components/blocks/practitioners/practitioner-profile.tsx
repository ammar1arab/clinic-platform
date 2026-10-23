'use client';

import { PractitionerEmploymentBadge } from './practitioner-employment-badge';
import { ROLE } from '@clinic/types';
import { useOwnerGenerateOtp } from '@/hooks/api/use-auth-mutations';
import { AccountOtpDialog } from '@/components/blocks/auth/account-otp-dialog';

import {
  useRouter } from 'next/navigation';
import { Badge } from '@/components/ui';
import {
  LANGUAGE_BADGE_VARIANT,
  WEEKDAY_OPTIONS,
  languageLabelList,
} from '@/constants/practitioner';
import {
  countryLabel,
  ContactLine,
  IconCard,
  PhoneLink,
  PreviewableAvatar,
  RowActionsMenu,
  TwoStepDeleteDialogs,
  useTwoStepDelete,
  ProfileEmpty,
  ProfileHero,
  ProfileInfoField,
  ProfileInfoGrid,
  ProfileSection,
  ProfileShell,
  ProfileSoftRow,
} from '@/components/primitives';
import { ROUTES } from '@/constants/routes';
import {
  useDeletePractitioner,
  useDeactivatePractitioner,
  useReactivatePractitioner,
} from '@/hooks/api/use-practitioners';
import { calcAge } from '@/lib/age';
import { leaveEntries, vacationDaysInYear, vacationsInYear } from './time-off';
import { formatDate, formatDateTime, formatTimeRange } from '@/lib/datetime';
import type { PractitionerDetail } from '@/services/practitioners.service';
import { IconMail, IconActivate, IconCalendar, IconDeactivate, IconDelete, IconEdit } from '@/constants/icons';
import { useAuth, useLanguage } from '@/providers';
import { getBilingualName, getStaffName } from '@/i18n';

export function PractitionerProfile({
  practitioner,
  clinicId,
  canManage = true,
}: {
  practitioner: PractitionerDetail;
  clinicId: string;
  canManage?: boolean;
}) {
  const router = useRouter();
  const deactivate = useDeactivatePractitioner(clinicId);
  const reactivate = useReactivatePractitioner(clinicId);
  const remove = useDeletePractitioner(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();
  const { user } = useAuth();
  const otp = useOwnerGenerateOtp();
  const { t, lang } = useLanguage();

  const toggling = deactivate.isPending || reactivate.isPending;
  const titleName = getStaffName(practitioner, lang);
  const specialtyName = getBilingualName(
    practitioner.specialty,
    practitioner.specialtyAr,
    lang,
  );
  const departmentName = getBilingualName(
    practitioner.departmentName,
    practitioner.departmentNameAr,
    lang,
  );
  const bioText = getBilingualName(practitioner.bio, practitioner.bioAr, lang);
  const nationality = practitioner.nationality
    ? countryLabel(practitioner.nationality, lang) ?? practitioner.nationality
    : null;
  const languages = languageLabelList(practitioner.languages, t);
  const genderLbl = practitioner.gender
    ? (t.constants.gender as Record<string, string>)[practitioner.gender.toLowerCase()] ?? practitioner.gender
    : null;
  const dobText = practitioner.dob
    ? `${formatDate(practitioner.dob, undefined, lang)}${calcAge(practitioner.dob) != null ? ` (${calcAge(practitioner.dob)} ${t.common.years})` : ''}`
    : null;

  const currentYear = new Date().getFullYear();
  const vacations = vacationsInYear(practitioner.timeOffs, currentYear);
  const leaves = leaveEntries(practitioner.timeOffs);

  return (
    <ProfileShell
      backHref={ROUTES.PRACTITIONERS}
      actions={canManage ? (
        <RowActionsMenu
          items={[
            {
              label: t.practitioner.edit,
              icon: IconEdit,
              href: ROUTES.PRACTITIONERS_EDIT(practitioner.id),
            },
            {
              label: t.practitioner.workingHours,
              icon: IconCalendar,
              href: ROUTES.PRACTITIONER_HOURS(practitioner.id),
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
            ...(user?.role === ROLE.OWNER
              ? [
                  {
                    label: t.common.generateOtp,
                    icon: IconMail,
                    disabled: otp.isPending,
                    onSelect: () => otp.mutate(practitioner.id),
                  },
                ]
              : []),
            {
              label: t.practitioner.delete,
              icon: IconDelete,
              variant: 'destructive',
              onSelect: () => del.ask({ id: practitioner.id, name: titleName }),
            },
          ]}
        />
      ) : undefined}
    >
      <ProfileHero
        avatar={
          <PreviewableAvatar
            src={practitioner.imageUrl}
            seed={practitioner.id}
            size="xl"
            priority
          />
        }
        title={titleName}
        badges={<PractitionerEmploymentBadge type={practitioner.employmentType} />}
        subtitle={specialtyName ? <p>{specialtyName}</p> : null}
        meta={<ContactLine phone={practitioner.phone} email={practitioner.email} />}
        stats={[
          {
            label: t.practitioner.services,
            value: String(practitioner.services.length),
          },
          {
            label: t.practitioner.bufferTime,
            value: `${practitioner.bufferMins}${t.common.minsCompact}`,
          },
          {
            label: t.practitioner.experience,
            value:
              practitioner.experienceYears != null
                ? `${practitioner.experienceYears} ${t.common.years}`
                : '—',
          },
        ]}
      />

      <ProfileSection title={t.practitioner.overview}>
        <ProfileInfoGrid className="lg:grid-cols-3">
          <ProfileInfoField label={t.practitioner.specialty} value={specialtyName} />
          <ProfileInfoField label={t.practitioner.department} value={departmentName} />
          <ProfileInfoField
            label={t.practitioner.defaultRoom}
            value={getBilingualName(
              practitioner.defaultRoomName,
              practitioner.defaultRoomNameAr,
              lang,
            )}
          />
          <ProfileInfoField label={t.practitioner.employment} value={practitioner.employmentType}>
            {practitioner.employmentType ? <PractitionerEmploymentBadge type={practitioner.employmentType} /> : null}
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
            <ProfileInfoField label={t.practitioner.whatsapp} value={practitioner.whatsapp}>
              <PhoneLink value={practitioner.whatsapp} className="text-sm font-medium" />
            </ProfileInfoField>
          ) : null}
          <ProfileInfoField label={t.practitioner.licenseNumber} value={practitioner.licenseNumber} />
          <ProfileInfoField
            label={t.practitioner.licenseExpiry}
            value={
              practitioner.licenseExpiry
                ? formatDate(practitioner.licenseExpiry, undefined, lang)
                : null
            }
          />
          <ProfileInfoField
            label={t.practitioner.joined}
            value={formatDate(practitioner.createdAt, undefined, lang)}
          />
        </ProfileInfoGrid>
      </ProfileSection>

      {bioText.trim() ? (
        <ProfileSection title={t.practitioner.bio}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {bioText}
          </p>
        </ProfileSection>
      ) : null}

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <ProfileSection
          title={t.practitioner.services}
          description={
            practitioner.services.length
              ? `${practitioner.services.length} ${t.practitioner.assigned}`
              : undefined
          }
          className="h-full"
          contentClassName="max-h-56 overflow-y-auto overscroll-y-contain"
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
                  <span className="min-w-0 truncate font-medium">
                    {getBilingualName(s.name, s.nameAr, lang)}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {s.durationMins}{t.common.minsCompact}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ProfileSection>

        <ProfileSection
          title={t.practitioner.weeklyAvailability}
          className="h-full"
          contentClassName="max-h-56 overflow-y-auto overscroll-y-contain"
        >
          {practitioner.availabilities.length === 0 ? (
            <ProfileEmpty>{t.practitioner.noWeeklyPatterns}</ProfileEmpty>
          ) : (
            <div className="space-y-1.5">
              {practitioner.availabilities.map((slot, index) => (
                <ProfileSoftRow
                  key={slot.id ?? `${slot.dayOfWeek}-${index}`}
                  title={t.constants.weekdays[WEEKDAY_OPTIONS[slot.dayOfWeek]] ?? t.practitioner.day}
                >
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatTimeRange(slot.startTime, slot.endTime, undefined, lang)}
                  </span>
                </ProfileSoftRow>
              ))}
            </div>
          )}
        </ProfileSection>

        <ProfileSection
          title={t.practitioner.extraAvailability}
          className="h-full"
          contentClassName="max-h-56 overflow-y-auto overscroll-y-contain"
        >
          {practitioner.availabilityOverrides.length === 0 ? (
            <ProfileEmpty>{t.practitioner.noExtraAvailability}</ProfileEmpty>
          ) : (
            <div className="space-y-1.5">
              {practitioner.availabilityOverrides.map((entry, index) => (
                <ProfileSoftRow
                  key={entry.id ?? `${entry.startAt}-${index}`}
                  title={formatDate(entry.startAt, undefined, lang)}
                  detail={entry.reason}
                >
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatTimeRange(entry.startAt, entry.endAt, undefined, lang)}
                  </span>
                </ProfileSoftRow>
              ))}
            </div>
          )}
        </ProfileSection>

        <ProfileSection
          title={t.scheduleRequests.kinds.vacation}
          className="h-full"
          contentClassName="max-h-56 overflow-y-auto overscroll-y-contain"
        >
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{t.practitioner.vacationDaysThisYear}</span>
            <span className="font-semibold tabular-nums text-foreground">{vacationDaysInYear(practitioner.timeOffs, currentYear)}</span>
          </div>
          {vacations.length === 0 ? (
            <ProfileEmpty>{t.practitioner.noVacations}</ProfileEmpty>
          ) : (
            <div className="space-y-1.5">
              {vacations.map((block, index) => (
                <ProfileSoftRow
                  key={block.id ?? `${block.startDate}-${index}`}
                  title={`${formatDate(block.startDate, undefined, lang)} - ${formatDate(block.endDate, undefined, lang)}`}
                  detail={block.reason}
                />
              ))}
            </div>
          )}
        </ProfileSection>

        <ProfileSection
          title={t.practitioner.leave}
          className="h-full"
          contentClassName="max-h-56 overflow-y-auto overscroll-y-contain"
        >
          {leaves.length === 0 ? (
            <ProfileEmpty>{t.practitioner.noLeaveBlocks}</ProfileEmpty>
          ) : (
            <div className="space-y-1.5">
              {leaves.map((block, index) => (
                <ProfileSoftRow
                  key={block.id ?? `${block.startDate}-${index}`}
                  title={`${formatDateTime(block.startDate, undefined, lang)} - ${formatDateTime(block.endDate, undefined, lang)}`}
                  detail={block.reason}
                />
              ))}
            </div>
          )}
        </ProfileSection>
      </div>

      {canManage && <AccountOtpDialog code={otp.data} onClose={otp.reset} />}

      {canManage && <TwoStepDeleteDialogs
        controller={del}
        onConfirm={(item) => remove.mutate(item.id, {
          onSuccess: () => {
            del.clear();
            router.push(ROUTES.PRACTITIONERS);
          },
        })}
        isPending={remove.isPending}
        warning={t.practitioner.deleteWarning1}
        finalWarning={t.practitioner.deleteWarning2}
        confirmLabel={t.practitioner.deleteConfirm}
      />}
      {canManage && <IconCard icon={IconCalendar} title={t.scheduleRequests.title} description={t.scheduleRequests.navigationDescription} href={`${ROUTES.SETTINGS_SCHEDULE_REQUESTS}?doctorId=${encodeURIComponent(practitioner.id)}`} />}
    </ProfileShell>
  );
}
