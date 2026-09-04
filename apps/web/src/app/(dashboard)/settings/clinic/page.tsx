'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  TimePicker,
  FormField,
  SectionLoader,
  PageBack,
} from '@/components/primitives';
import { ButtonSpinner } from '@/components/primitives';;
import { useClinic, useUpdateClinic } from '@/hooks/api/use-clinic';
import { useDepartments } from '@/hooks/api/use-departments';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useLanguage } from '@/providers';
import { FORM_NONE } from '@/constants/form';
import { ROUTES } from '@/constants/routes';
import type { Clinic } from '@/services/clinics.service';

const TIMEZONES = [
  'UTC',
  'Asia/Amman',
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Kuwait',
  'Asia/Bahrain',
  'Asia/Qatar',
  'Africa/Cairo',
  'Europe/Istanbul',
  'Europe/London',
];

interface FormProps {
  clinic: Clinic;
  clinicId: string;
}

function ClinicSettingsForm({ clinic, clinicId }: FormProps) {
  const { t, lang } = useLanguage();
  const { data: departments } = useDepartments(clinicId);
  const updateMutation = useUpdateClinic(clinicId);

  const [workingHoursStart, setWorkingHoursStart] = useState(clinic.workingHoursStart || '08:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState(clinic.workingHoursEnd || '20:00');
  const [timezone, setTimezone] = useState(clinic.timezone || 'UTC');
  const [defaultCalendarView, setDefaultCalendarView] = useState<'day' | 'week' | 'month'>(
    clinic.defaultCalendarView || 'month',
  );
  const [defaultSessionType, setDefaultSessionType] = useState<'in_person' | 'online'>(
    clinic.defaultSessionType || 'in_person',
  );
  const [defaultDepartmentId, setDefaultDepartmentId] = useState(clinic.defaultDepartmentId ?? '');
  const [letterheadFooter, setLetterheadFooter] = useState(clinic.letterheadFooter ?? '');

  const handleSave = () => {
    updateMutation.mutate({
      workingHoursStart,
      workingHoursEnd,
      timezone,
      defaultCalendarView,
      defaultSessionType,
      defaultDepartmentId: defaultDepartmentId || null,
      letterheadFooter: letterheadFooter.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t.settings.workingHours}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={t.settings.opens} htmlFor="hours-start">
            <TimePicker
              value={workingHoursStart}
              onChange={setWorkingHoursStart}
              placeholder={t.settings.opens}
              className="h-10"
              step={15}
            />
          </FormField>
          <FormField label={t.settings.closes} htmlFor="hours-end">
            <TimePicker
              value={workingHoursEnd}
              onChange={setWorkingHoursEnd}
              placeholder={t.settings.closes}
              className="h-10"
              step={15}
            />
          </FormField>
          <FormField label={t.settings.timezone} className="sm:col-span-2">
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t.settings.scheduleDefaults}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label={t.settings.defaultCalendarView}>
            <Select
              value={defaultCalendarView}
              onValueChange={(v) => setDefaultCalendarView(v as 'day' | 'week' | 'month')}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">{t.appointments.month}</SelectItem>
                <SelectItem value="week">{t.appointments.week}</SelectItem>
                <SelectItem value="day">{t.appointments.day}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t.settings.defaultSessionType}>
            <Select
              value={defaultSessionType}
              onValueChange={(v) => setDefaultSessionType(v as 'in_person' | 'online')}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_person">{t.appointments.inPerson}</SelectItem>
                <SelectItem value="online">{t.appointments.online}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t.settings.defaultDepartment}>
            <Select
              value={defaultDepartmentId || FORM_NONE}
              onValueChange={(v) => setDefaultDepartmentId(v === FORM_NONE ? '' : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.common.none} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FORM_NONE}>{t.common.none}</SelectItem>
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {lang === 'ar' && d.nameAr ? d.nameAr : d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t.settings.reportLetterhead}</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label={t.settings.footerText} htmlFor="footer">
            <Input
              id="footer"
              value={letterheadFooter}
              onChange={(e) => setLetterheadFooter(e.target.value)}
              placeholder={t.settings.reportLetterheadDesc}
              maxLength={200}
            />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <ButtonSpinner />}
          {t.common.save}
        </Button>
      </div>
    </div>
  );
}

export default function ClinicSettingsPage() {
  const clinicId = useClinicId();
  const { data: clinic, isLoading } = useClinic(clinicId);
  const { t } = useLanguage();

  if (isLoading || !clinic) {
    return <SectionLoader label={t.common.loading} />;
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4">
      <PageBack backHref={ROUTES.SETTINGS} backLabel={t.settings.title} />
      <ClinicSettingsForm key={clinic.id} clinic={clinic} clinicId={clinicId} />
    </div>
  );
}
