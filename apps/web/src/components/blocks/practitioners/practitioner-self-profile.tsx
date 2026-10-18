'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Badge, Button, Card, CardContent, Input, Textarea } from '@/components/ui';
import {
  EmptyState, FormActions, FormField, PreviewableAvatar, ProfileInfoField,
  ProfileInfoGrid, ProfileSection, ProfileShell,
} from '@/components/primitives';
import { useUpdatePractitionerSelfProfile } from '@/hooks/api/use-practitioners';
import { IconCalendarClock, IconEdit, IconLock, IconService } from '@/constants/icons';
import { getBilingualName } from '@/i18n';
import { formatDate } from '@/lib/datetime';
import type { PractitionerDetail, PractitionerSelfProfileInput } from '@/services/practitioners.service';
import { useLanguage } from '@/providers';
import { ROUTES } from '@/constants/routes';

const WEEKDAY_KEYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const display = (value: string | null | undefined) => value?.trim() || null;

export function PractitionerSelfProfile({ practitioner }: { practitioner: PractitionerDetail }) {
  const { lang, t } = useLanguage();
  const [editing, setEditing] = useState(false);
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
      backLabel={editing ? t.common.accountProfile : t.layout.sidebar.dashboard}
      actions={!editing ? (
        <Button type="button" variant="outline" onClick={() => setEditing(true)}>
          <IconEdit className="size-3.5" />{t.practitioner.edit}
        </Button>
      ) : undefined}
    >
      <Card className="card-aura overflow-hidden ring-0">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <PreviewableAvatar src={practitioner.imageUrl} seed={practitioner.id} size="xl" priority />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">{name}</h1>
              <Badge variant={practitioner.isActive ? 'success' : 'muted'}>
                {practitioner.isActive ? t.practitioner.active : t.common.inactive}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{specialty || t.practitioner.practitioner}</p>
            <p className="text-sm text-muted-foreground">{practitioner.email}</p>
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
              <FormField label={t.practitioner.bio} htmlFor="self-bio"><Textarea id="self-bio" rows={4} {...register('bio')} /></FormField>
              <FormField label={t.practitioner.bioAr} htmlFor="self-bio-ar"><Textarea id="self-bio-ar" dir="rtl" rows={4} {...register('bioAr')} /></FormField>
            </div>
            <FormActions className="mt-5" onCancel={() => { reset(); setEditing(false); }} submitLabel={t.common.save} pending={mutation.isPending} />
          </ProfileSection>
          <ProfileSection
            title={t.practitioner.professionalInfo}
            action={<LockedSectionBadge label={t.common.readOnly} />}
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
        <ProfileSection title={t.practitioner.services} action={editing ? <LockedSectionBadge label={t.common.readOnly} /> : undefined}>
          {practitioner.services.length ? <div className="flex flex-wrap gap-2">{practitioner.services.map((service) => <Badge key={service.id} variant="secondary">{getBilingualName(service.name, service.nameAr, lang)}</Badge>)}</div> : <EmptyState size="compact" icon={IconService} title={t.practitioner.noServicesAssigned} />}
        </ProfileSection>
        <ProfileSection title={t.practitioner.weeklyAvailability} action={editing ? <LockedSectionBadge label={t.common.readOnly} /> : undefined}>
          {practitioner.availabilities.length ? <div className="space-y-2">{practitioner.availabilities.map((slot) => <div key={slot.id ?? `${slot.dayOfWeek}-${slot.startTime}`} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"><span>{t.constants.weekdays[WEEKDAY_KEYS[slot.dayOfWeek]]}</span><span className="font-medium">{slot.startTime} - {slot.endTime}</span></div>)}</div> : <EmptyState size="compact" icon={IconCalendarClock} title={t.practitioner.noWeeklyPatterns} />}
        </ProfileSection>
        <ProfileSection title={t.practitioner.extraAvailability} action={editing ? <LockedSectionBadge label={t.common.readOnly} /> : undefined}>
          {practitioner.availabilityOverrides.length ? practitioner.availabilityOverrides.map((entry) => <div key={entry.id ?? entry.startAt} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"><span>{entry.reason || t.practitioner.extraAvailability}</span><span className="font-medium">{entry.startAt.slice(0, 10)}</span></div>) : <EmptyState size="compact" icon={IconCalendarClock} title={t.practitioner.noExtraAvailability} />}
        </ProfileSection>
        <ProfileSection title={t.practitioner.leave} action={editing ? <LockedSectionBadge label={t.common.readOnly} /> : undefined}>
          {practitioner.timeOffs.length ? practitioner.timeOffs.map((entry) => <div key={entry.id ?? entry.startDate} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"><span>{entry.reason || t.practitioner.leave}</span><span className="font-medium">{entry.startDate.slice(0, 10)} - {entry.endDate.slice(0, 10)}</span></div>) : <EmptyState size="compact" icon={IconCalendarClock} title={t.practitioner.noLeaveBlocks} />}
        </ProfileSection>
      </div>
    </ProfileShell>
  );
}

function LockedSectionBadge({ label }: { label: string }) {
  return (
    <span
      title={label}
      aria-label={label}
      className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/15 bg-primary/5 text-primary"
    >
      <IconLock className="size-3.5" aria-hidden />
    </span>
  );
}
