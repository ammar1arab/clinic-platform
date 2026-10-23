'use client';

import { PractitionerEmploymentBadge } from './practitioner-employment-badge';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { can, PROFILE_PERMISSIONS } from '@clinic/types';
import { Badge, Button, Card, CardContent, Input, Textarea } from '@/components/ui';
import {
  ContactLine,
  ProfileViewSkeleton,
  EmptyState, FormActions, FormField, PreviewableAvatar, ProfileEmpty, ProfileHero,
  ProfileInfoField, ProfileInfoGrid, ProfileSection, ProfileShell, ReadOnlyMark,
} from '@/components/primitives';
import { useUpdatePractitionerSelfProfile } from '@/hooks/api/use-practitioners';
import { IconCalendarClock, IconEdit } from '@/constants/icons';
import { getBilingualName } from '@/i18n';
import { formatDate } from '@/lib/datetime';
import type { PractitionerDetail, PractitionerSelfProfileInput } from '@/services/practitioners.service';
import { useAuth, useLanguage } from '@/providers';
import { ROUTES } from '@/constants/routes';
import { NotePreference } from '@/components/blocks/visits/note-preference';
import { ScheduleEntryList } from './practitioner-hours-summary';
import { PractitionerTimeOffSection } from './practitioner-time-off-section';
import { splitTimeOff } from './time-off';

const WEEKDAY_KEYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const display = (value: string | null | undefined) => value?.trim() || null;

export function PractitionerSelfProfileSkeleton() {
  return <ProfileViewSkeleton variant="self" backHref={ROUTES.DASHBOARD} />;
}

export function PractitionerSelfProfile({ practitioner }: { practitioner: PractitionerDetail }) {
  const { vacations, leaves, vacationDays } = useMemo(
    () => splitTimeOff(practitioner.timeOffs, new Date().getFullYear()),
    [practitioner.timeOffs],
  );
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const lockProfessional = !can(user?.role, PROFILE_PERMISSIONS.professional);
  const lockServices = !can(user?.role, PROFILE_PERMISSIONS.services);
  const lockAvailability = !can(user?.role, PROFILE_PERMISSIONS.availability);
  const lockCredentials = !can(user?.role, PROFILE_PERMISSIONS.credentials);
  const mutation = useUpdatePractitionerSelfProfile(practitioner.clinicId, practitioner.id);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PractitionerSelfProfileInput>({
    defaultValues: {
      name: practitioner.name,
      nameAr: practitioner.nameAr ?? '',
      phone: practitioner.phone ?? '',
      whatsapp: practitioner.whatsapp ?? '',
      bio: practitioner.bio ?? '',
      bioAr: practitioner.bioAr ?? '',
    },
  });

  const name = getBilingualName(practitioner.name, practitioner.nameAr, lang);
  const specialty = getBilingualName(practitioner.specialty, practitioner.specialtyAr, lang);
  const department = getBilingualName(practitioner.departmentName, practitioner.departmentNameAr, lang);
  const room = getBilingualName(practitioner.defaultRoomName, practitioner.defaultRoomNameAr, lang);

  const save = (data: PractitionerSelfProfileInput) => {
    mutation.mutate(data, {
      onSuccess: (next) => {
        reset({
          name: next.name, nameAr: next.nameAr ?? '', phone: next.phone ?? '',
          whatsapp: next.whatsapp ?? '', bio: next.bio ?? '', bioAr: next.bioAr ?? '',
        });
        setEditing(false);
      },
    });
  };

  return (
    <ProfileShell
      backHref={editing ? ROUTES.PROFILE : ROUTES.DASHBOARD}
      onBack={editing ? () => { reset(); setEditing(false); } : undefined}
      actions={!editing ? (
        <Button type="button" variant="outline" onClick={() => setEditing(true)}>
          <IconEdit className="size-3.5" />{t.practitioner.edit}
        </Button>
      ) : undefined}
    >
      <ProfileHero
        avatar={<PreviewableAvatar src={practitioner.imageUrl} seed={practitioner.id} size="xl" priority />}
        title={name}
        subtitle={specialty || t.practitioner.practitioner}
        meta={<ContactLine phone={practitioner.phone} email={practitioner.email} className="text-xs sm:text-sm" />}
        stats={[]}
      />

      {editing ? (
        <form onSubmit={handleSubmit(save)}>
          <ProfileSection title={t.practitioner.overview} description={t.practitioner.edit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t.common.name} htmlFor="self-name" error={errors.name?.message} required>
                <Input id="self-name" {...register('name', { required: t.validation.required })} />
              </FormField>
              <FormField label={t.ui.nameArabic} htmlFor="self-name-ar"><Input id="self-name-ar" dir="rtl" {...register('nameAr')} /></FormField>
              <FormField label={t.practitioner.phone} htmlFor="self-phone"><Input id="self-phone" type="tel" {...register('phone')} /></FormField>
              <FormField label={t.practitioner.whatsapp} htmlFor="self-whatsapp"><Input id="self-whatsapp" type="tel" {...register('whatsapp')} /></FormField>
              <FormField label={t.practitioner.bio} htmlFor="self-bio" className="sm:col-span-2">
                <Textarea id="self-bio" rows={4} {...register('bio')} className="h-28 min-h-28 max-h-28 resize-none overflow-y-auto field-sizing-fixed" />
              </FormField>
              <FormField label={t.practitioner.bioAr} htmlFor="self-bio-ar" className="sm:col-span-2">
                <Textarea id="self-bio-ar" dir="rtl" rows={4} {...register('bioAr')} className="h-28 min-h-28 max-h-28 resize-none overflow-y-auto field-sizing-fixed" />
              </FormField>
            </div>
            <FormActions className="mt-5" onCancel={() => { reset(); setEditing(false); }} submitLabel={t.common.save} pending={mutation.isPending} />
          </ProfileSection>
          <ProfileSection
            title={t.practitioner.professionalInfo}
            action={lockProfessional || lockCredentials ? <ReadOnlyMark label={t.common.readOnly} size="md" /> : undefined}
          >
            <ProfileInfoGrid className="lg:grid-cols-3">
              <ProfileInfoField label={t.practitioner.email} value={practitioner.email} />
              <ProfileInfoField label={t.practitioner.specialty} value={specialty} />
              <ProfileInfoField label={t.practitioner.department} value={department} />
              <ProfileInfoField label={t.practitioner.defaultRoom} value={room} />
              <ProfileInfoField label={t.practitioner.employment} value={practitioner.employmentType}>
              {practitioner.employmentType ? <PractitionerEmploymentBadge type={practitioner.employmentType} /> : null}
            </ProfileInfoField>
              <ProfileInfoField label={t.practitioner.licenseNumber} value={display(practitioner.licenseNumber)} />
              <ProfileInfoField label={t.practitioner.licenseExpiry} value={formatDate(practitioner.licenseExpiry, undefined, lang)} />
            </ProfileInfoGrid>
          </ProfileSection>
        </form>
      ) : (
        <ProfileSection title={t.practitioner.overview}>
          <ProfileInfoGrid className="lg:grid-cols-3">
            <ProfileInfoField label={t.practitioner.phone} value={display(practitioner.phone)} />
            <ProfileInfoField label={t.practitioner.whatsapp} value={display(practitioner.whatsapp)} />
            <ProfileInfoField label={t.practitioner.email} value={practitioner.email} />
            <ProfileInfoField label={t.practitioner.specialty} value={specialty} />
            <ProfileInfoField label={t.practitioner.department} value={department} />
            <ProfileInfoField label={t.practitioner.defaultRoom} value={room} />
            <ProfileInfoField label={t.practitioner.employment} value={practitioner.employmentType}>
              {practitioner.employmentType ? <PractitionerEmploymentBadge type={practitioner.employmentType} /> : null}
            </ProfileInfoField>
            <ProfileInfoField label={t.practitioner.licenseNumber} value={display(practitioner.licenseNumber)} />
            <ProfileInfoField label={t.practitioner.licenseExpiry} value={formatDate(practitioner.licenseExpiry, undefined, lang)} />
          </ProfileInfoGrid>
          {display(getBilingualName(practitioner.bio, practitioner.bioAr, lang)) ? <p className="mt-5 whitespace-pre-wrap border-t border-border/70 pt-4 text-sm leading-relaxed text-muted-foreground">{getBilingualName(practitioner.bio, practitioner.bioAr, lang)}</p> : null}
        </ProfileSection>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileSection title={t.practitioner.services} action={editing && lockServices ? <ReadOnlyMark label={t.common.readOnly} size="md" /> : undefined}>
          {practitioner.services.length ? <div className="flex flex-wrap gap-2">{practitioner.services.map((service) => <Badge key={service.id} variant="secondary">{getBilingualName(service.name, service.nameAr, lang)}</Badge>)}</div> : <ProfileEmpty>{t.practitioner.noServicesAssigned}</ProfileEmpty>}
        </ProfileSection>
        <ProfileSection title={t.practitioner.weeklyAvailability} action={editing && lockAvailability ? <ReadOnlyMark label={t.common.readOnly} size="md" /> : undefined}>
          {practitioner.availabilities.length ? <div className="space-y-2">{practitioner.availabilities.map((slot) => <div key={slot.id ?? `${slot.dayOfWeek}-${slot.startTime}`} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"><span>{t.constants.weekdays[WEEKDAY_KEYS[slot.dayOfWeek]]}</span><span className="font-medium">{slot.startTime} - {slot.endTime}</span></div>)}</div> : <ProfileEmpty>{t.practitioner.noWeeklyPatterns}</ProfileEmpty>}
        </ProfileSection>
        <ProfileSection title={t.practitioner.extraAvailability} action={editing && lockAvailability ? <ReadOnlyMark label={t.common.readOnly} size="md" /> : undefined}>
          {practitioner.availabilityOverrides.length ? <ScheduleEntryList entries={practitioner.availabilityOverrides.map((entry) => ({ title: entry.reason, start: entry.startAt, end: entry.endAt }))} fallback={t.practitioner.extraAvailability} /> : <EmptyState framed={false} icon={IconCalendarClock} title={t.practitioner.extraAvailability} />}
        </ProfileSection>
        <PractitionerTimeOffSection
          title={t.scheduleRequests.kinds.vacation}
          entries={vacations}
          emptyLabel={t.practitioner.noVacations}
          action={editing && lockAvailability ? <ReadOnlyMark label={t.common.readOnly} size="md" /> : undefined}
          count={vacationDays}
          dateOnly
        />
        <PractitionerTimeOffSection
          title={t.practitioner.leave}
          entries={leaves}
          emptyLabel={t.practitioner.noLeaveBlocks}
          action={editing && lockAvailability ? <ReadOnlyMark label={t.common.readOnly} size="md" /> : undefined}
          count={leaves.length}
        />
      </div>
      <Card className="card-aura gap-0 py-0 ring-0">
        <CardContent className="flex flex-col items-stretch gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
          <h2 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight">{t.visits.preference}</h2>
          <div className="w-full shrink-0 sm:w-[min(16rem,55%)]"><NotePreference /></div>
        </CardContent>
      </Card>
    </ProfileShell>
  );
}
