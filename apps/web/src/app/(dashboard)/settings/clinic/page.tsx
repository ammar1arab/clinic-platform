'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys';
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
  FormPageSkeleton,
  ButtonSpinner,
  ErrorState,
  AvatarUpload,
  BilingualNameFields,
  BrandColorField,
} from '@/components/primitives';
import { useClinic, useUpdateClinic } from '@/hooks/api/use-clinic';
import { useDepartments } from '@/hooks/api/use-departments';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useLanguage } from '@/providers';
import { FORM_NONE } from '@/constants/form';
import { SettingsPageBack } from '@/components/blocks/settings/settings-navigation';
import { readClinicLogo, stripSolidBackdrop, writeClinicLogo } from '@/lib/clinic-logo';
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
  const queryClient = useQueryClient();
  const mirror = (patch: Partial<Clinic>) => {
    queryClient.setQueryData<Clinic>(QUERY_KEYS.clinics.detail(clinicId), (current) =>
      current ? { ...current, ...patch } : current,
    );
  };
  const storeLogo = async (url: string) => {
    let stored = url;
    if (url.startsWith('blob:')) {
      const blob = await fetch(url).then((response) => response.blob());
      stored = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      URL.revokeObjectURL(url);
    }
    stored = await stripSolidBackdrop(stored);
    if (logoUrl.startsWith('blob:') && logoUrl !== url) URL.revokeObjectURL(logoUrl);
    const updated = await updateMutation.mutateAsync({ logoUrl: stored || null });
    const nextLogo = updated.logoUrl || '';
    setLogoUrl(nextLogo);
    writeClinicLogo(clinicId, nextLogo || null);
    mirror({ logoUrl: nextLogo || null });
  };

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
  const [name, setName] = useState(clinic.name);
  const [nameAr, setNameAr] = useState(clinic.nameAr ?? '');
  const [email, setEmail] = useState(clinic.email ?? '');
  const [phone, setPhone] = useState(clinic.phone ?? '');
  const [address, setAddress] = useState(clinic.address ?? '');
  const [logoUrl, setLogoUrl] = useState(
    () => readClinicLogo(clinicId) || clinic.logoUrl || '',
  );
  const [brandColor, setBrandColor] = useState(clinic.brandColor ?? '#0f766e');

  const handleSave = () => {
    updateMutation.mutate({
      workingHoursStart,
      workingHoursEnd,
      timezone,
      defaultCalendarView,
      defaultSessionType,
      defaultDepartmentId: defaultDepartmentId || null,
      letterheadFooter: letterheadFooter.trim() || undefined,
      name: name.trim(),
      nameAr: nameAr.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim(),
      address: address.trim(),
      logoUrl: logoUrl || null,
      brandColor,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex min-w-0 flex-col items-center gap-6">
            <AvatarUpload
              plain
              value={logoUrl}
              onChange={(url) => void storeLogo(url)}
              fallbackLabel={name}
            />
            <div className="w-full min-w-0 space-y-4">
              <BilingualNameFields
                name={name}
                nameAr={nameAr}
                onNameChange={(value) => {
                  setName(value);
                  mirror({ name: value });
                }}
                onNameArChange={(value) => {
                  setNameAr(value);
                  mirror({ nameAr: value || null });
                }}
                maxLength={120}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label={t.common.clinicContactEmail} htmlFor="clinic-email">
                  <Input
                    id="clinic-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      mirror({ email: event.target.value || null });
                    }}
                    maxLength={200}
                  />
                </FormField>
                <FormField label={t.exports.phone} htmlFor="clinic-phone">
                  <Input id="clinic-phone" type="tel" dir="ltr" value={phone} onChange={event => setPhone(event.target.value)} maxLength={40} />
                </FormField>
                <FormField label={t.emails.clinicAddress} htmlFor="clinic-address">
                  <Input id="clinic-address" value={address} onChange={event => setAddress(event.target.value)} maxLength={500} />
                </FormField>
                <FormField label={t.settings.brandColor}>
                  <BrandColorField
                    value={brandColor}
                    onChange={(value) => {
                      setBrandColor(value);
                      if (/^#[0-9A-Fa-f]{6}$/.test(value)) mirror({ brandColor: value });
                    }}
                    label={t.settings.brandColor}
                  />
                </FormField>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t.settings.workingHours}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={t.settings.opens} htmlFor="hours-start">
            <TimePicker
              value={workingHoursStart}
              onChange={(value) => {
                setWorkingHoursStart(value);
                mirror({ workingHoursStart: value });
              }}
              placeholder={t.settings.opens}
              className="h-10"
              step={15}
            />
          </FormField>
          <FormField label={t.settings.closes} htmlFor="hours-end">
            <TimePicker
              value={workingHoursEnd}
              onChange={(value) => {
                setWorkingHoursEnd(value);
                mirror({ workingHoursEnd: value });
              }}
              placeholder={t.settings.closes}
              className="h-10"
              step={15}
            />
          </FormField>
          <FormField label={t.settings.timezone} className="sm:col-span-2">
            <Select
              value={timezone}
              onValueChange={(value) => {
                setTimezone(value);
                mirror({ timezone: value });
              }}
            >
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
              onValueChange={(v) => {
                const next = v as 'day' | 'week' | 'month';
                setDefaultCalendarView(next);
                mirror({ defaultCalendarView: next });
              }}
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
              onValueChange={(v) => {
                const next = v as 'in_person' | 'online';
                setDefaultSessionType(next);
                mirror({ defaultSessionType: next });
              }}
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
              onValueChange={(v) => {
                const next = v === FORM_NONE ? '' : v;
                setDefaultDepartmentId(next);
                mirror({ defaultDepartmentId: next || null });
              }}
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
              onChange={(e) => {
                setLetterheadFooter(e.target.value);
                mirror({ letterheadFooter: e.target.value || null });
              }}
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
  const { data: clinic, isLoading, isError, refetch } = useClinic(clinicId);

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (isLoading || !clinic) {
    return <FormPageSkeleton />;
  }

  return (
    <div className="page-stack space-y-4">
      <SettingsPageBack />
      <ClinicSettingsForm key={clinic.id} clinic={clinic} clinicId={clinicId} />
    </div>
  );
}
