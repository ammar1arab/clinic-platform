'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { can, PROFILE_PERMISSIONS } from '@clinic/types';
import { Badge, Button, Card, CardContent, Input, Textarea } from '@/components/ui';
import {
  ContactLine,
  EmptyState, FormActions, FormField, PreviewableAvatar, ProfileInfoField,
  ProfileInfoGrid, ProfileSection, ProfileShell, ReadOnlyMark,
} from '@/components/primitives';
import { useUpdatePractitionerSelfProfile } from '@/hooks/api/use-practitioners';
import { IconCalendarClock, IconEdit, IconService } from '@/constants/icons';
import { getBilingualName } from '@/i18n';
import { formatDate } from '@/lib/datetime';
import type { PractitionerDetail, PractitionerSelfProfileInput } from '@/services/practitioners.service';
import { useAuth, useLanguage } from '@/providers';
import { ROUTES } from '@/constants/routes';
import { NotePreference } from '@/components/blocks/visits/note-preference';

const WEEKDAY_KEYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const display = (value: string | null | undefined) => value?.trim() || null;

export function PractitionerSelfProfile({ practitioner }: { practitioner: PractitionerDetail }) {
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
      actions={!editing ? (
        <Button type="button" variant="outline" onClick={() => setEditing(true)}>
          <IconEdit className="size-3.5" />{t.practitioner.edit}
        </Button>
      ) : undefined}
    >
      <Card className="card-aura overflow-hidden ring-0">
        <CardContent className="flex flex-row items-center gap-3 p-4 sm:gap-5 sm:p-5">
          <PreviewableAvatar src={practitioner.imageUrl} seed={practitioner.id} size="xl" priority />
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="truncate font-heading text-base font-semibold tracking-tight sm:text-lg">{name}</h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{specialty || t.practitioner.practitioner}</p>
            <ContactLine phone={practitioner.phone} email={practitioner.email} className="text-xs sm:text-sm" />
          </div>
        </CardContent>
      </Card>

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
              <ProfileInfoField label={t.practitioner.employment} value={practitioner.employmentType} />
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
            <ProfileInfoField label={t.practitioner.employment} value={practitioner.employmentType} />
            <ProfileInfoField label={t.practitioner.licenseNumber} value={display(practitioner.licenseNumber)} />
            <ProfileInfoField label={t.practitioner.licenseExpiry} value={formatDate(practitioner.licenseExpiry, undefined, lang)} />
          </ProfileInfoGrid>
          {display(getBilingualName(practitioner.bio, practitioner.bioAr, lang)) ? <p className="mt-5 whitespace-pre-wrap border-t border-border/70 pt-4 text-sm leading-relaxed text-muted-foreground">{getBilingualName(practitioner.bio, practitioner.bioAr, lang)}</p> : null}
        </ProfileSection>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileSection title={t.practitioner.services} action={editing && lockServices ? <ReadOnlyMark label={t.common.readOnly} size="md" /> : undefined}>
          {practitioner.services.length ? <div className="flex flex-wrap gap-2">{practitioner.services.map((service) => <Badge key={service.id} variant="secondary">{getBilingualName(service.name, service.nameAr, lang)}</Badge>)}</div> : <EmptyState size="compact" icon={IconService} title={t.practitioner.noServicesAssigned} />}
        </ProfileSection>
        <ProfileSection title={t.practitioner.weeklyAvailability} action={editing && lockAvailability ? <ReadOnlyMark label={t.common.readOnly} size="md" /> : undefined}>
          {practitioner.availabilities.length ? <div className="space-y-2">{practitioner.availabilities.map((slot) => <div key={slot.id ?? `${slot.dayOfWeek}-${slot.startTime}`} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"><span>{t.constants.weekdays[WEEKDAY_KEYS[slot.dayOfWeek]]}</span><span className="font-medium">{slot.startTime} - {slot.endTime}</span></div>)}</div> : <EmptyState size="compact" icon={IconCalendarClock} title={t.practitioner.noWeeklyPatterns} />}
        </ProfileSection>
        <ProfileSection title={t.practitioner.extraAvailability} action={editing && lockAvailability ? <ReadOnlyMark label={t.common.readOnly} size="md" /> : undefined}>
          {practitioner.availabilityOverrides.length ? practitioner.availabilityOverrides.map((entry) => <div key={entry.id ?? entry.startAt} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"><span>{entry.reason || t.practitioner.extraAvailability}</span><span className="font-medium">{entry.startAt.slice(0, 10)}</span></div>) : <EmptyState size="compact" icon={IconCalendarClock} title={t.practitioner.noExtraAvailability} />}
        </ProfileSection>
        <ProfileSection title={t.practitioner.leave} action={editing && lockAvailability ? <ReadOnlyMark label={t.common.readOnly} size="md" /> : undefined}>
          {practitioner.timeOffs.length ? practitioner.timeOffs.map((entry) => <div key={entry.id ?? entry.startDate} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"><span>{entry.reason || t.practitioner.leave}</span><span className="font-medium">{entry.startDate.slice(0, 10)} - {entry.endDate.slice(0, 10)}</span></div>) : <EmptyState size="compact" icon={IconCalendarClock} title={t.practitioner.noLeaveBlocks} />}
        </ProfileSection>
      </div>

      <ProfileSection title={t.visits.preference}>
        <NotePreference />
      </ProfileSection>
    </ProfileShell>
  );
}
