'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TimePicker } from '@/components/primitives/time-picker';
import { FormField } from '@/components/primitives/form-field';
import { SectionLoader } from '@/components/primitives/spinner';
import { ButtonSpinner } from '@/components/blocks/feedback';
import { useClinic, useUpdateClinic } from '@/hooks/use-clinic';
import { useDepartments } from '@/hooks/use-departments';
import { useClinicId } from '@/hooks/use-clinic-id';
import type { Clinic } from '@/services/clinics.service';

const NONE = '__none__';

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
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Working hours</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Opens" htmlFor="hours-start">
            <TimePicker
              value={workingHoursStart}
              onChange={setWorkingHoursStart}
              placeholder="Opens"
              className="h-10"
              step={15}
            />
          </FormField>
          <FormField label="Closes" htmlFor="hours-end">
            <TimePicker
              value={workingHoursEnd}
              onChange={setWorkingHoursEnd}
              placeholder="Closes"
              className="h-10"
              step={15}
            />
          </FormField>
          <FormField label="Timezone" className="sm:col-span-2">
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
          <CardTitle className="text-sm">Schedule defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Default calendar view">
            <Select
              value={defaultCalendarView}
              onValueChange={(v) => setDefaultCalendarView(v as 'day' | 'week' | 'month')}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Default session type">
            <Select
              value={defaultSessionType}
              onValueChange={(v) => setDefaultSessionType(v as 'in_person' | 'online')}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_person">In person</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Default department">
            <Select
              value={defaultDepartmentId || NONE}
              onValueChange={(v) => setDefaultDepartmentId(v === NONE ? '' : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report letterhead</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="Footer text" htmlFor="footer">
            <Input
              id="footer"
              value={letterheadFooter}
              onChange={(e) => setLetterheadFooter(e.target.value)}
              placeholder="Optional line on patient PDF reports"
              maxLength={200}
            />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <ButtonSpinner />}
          Save settings
        </Button>
      </div>
    </div>
  );
}

export default function ClinicSettingsPage() {
  const clinicId = useClinicId();
  const { data: clinic, isLoading } = useClinic(clinicId);

  if (isLoading || !clinic) {
    return <SectionLoader label="Loading clinic settings…" />;
  }

  return <ClinicSettingsForm key={clinic.id} clinic={clinic} clinicId={clinicId} />;
}
