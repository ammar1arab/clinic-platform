'use client';

import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { IconCalendarClock, IconPractitioner, IconRoom, IconService } from '@/constants/icons';
import { IconWell, MetaStat } from '@/components/primitives';
import { getBilingualName } from '@/i18n';
import type { PractitionerDetail } from '@/services/practitioners.service';
import { useLanguage } from '@/providers';

const WEEKDAY_KEYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function PractitionerSelfProfile({ practitioner }: { practitioner: PractitionerDetail }) {
  const { lang, t } = useLanguage();
  const name = getBilingualName(practitioner.name, practitioner.nameAr, lang);
  const specialty = getBilingualName(practitioner.specialty, practitioner.specialtyAr, lang);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Card className="card-aura border-border bg-card">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <IconWell icon={IconPractitioner} size="lg" accent="default" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{specialty || t.practitioner.practitioner}</p>
            <h2 className="mt-1 truncate font-heading text-2xl font-semibold tracking-tight">{name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{practitioner.email}</p>
          </div>
          <Badge variant={practitioner.isActive ? 'success' : 'muted'}>{practitioner.isActive ? t.practitioner.active : t.common.inactive}</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <MetaStat label={t.practitioner.department} value={getBilingualName(practitioner.departmentName, practitioner.departmentNameAr, lang) || '—'} />
        <MetaStat label={t.practitioner.defaultRoom} value={getBilingualName(practitioner.defaultRoomName, practitioner.defaultRoomNameAr, lang) || '—'} />
        <MetaStat label={t.practitioner.buffer} value={`${practitioner.bufferMins}${t.common.minsCompact}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><IconService className="size-4 text-primary" />{t.practitioner.services}</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {practitioner.services.length ? practitioner.services.map((service) => <Badge key={service.id} variant="secondary">{getBilingualName(service.name, service.nameAr, lang)}</Badge>) : <p className="text-sm text-muted-foreground">{t.practitioner.noServicesAssigned}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><IconCalendarClock className="size-4 text-primary" />{t.practitioner.weeklyAvailability}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {practitioner.availabilities.length ? practitioner.availabilities.map((slot) => <div key={slot.id ?? `${slot.dayOfWeek}-${slot.startTime}`} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"><span>{t.constants.weekdays[WEEKDAY_KEYS[slot.dayOfWeek]]}</span><span className="font-medium">{slot.startTime} - {slot.endTime}</span></div>) : <p className="text-sm text-muted-foreground">{t.practitioner.noWeeklyPatterns}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
