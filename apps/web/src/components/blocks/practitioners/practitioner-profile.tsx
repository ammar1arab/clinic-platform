'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Pencil, UserCheck, UserX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  PRACTITIONER_EMPLOYMENT_LABEL,
  WEEKDAY_OPTIONS,
} from '@/constants/practitioner';
import { ROUTES } from '@/constants/routes';
import {
  useDeactivatePractitioner,
  useReactivatePractitioner,
} from '@/hooks/use-practitioners';
import type { PractitionerDetail } from '@/services/practitioners.service';

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate" title={value ?? undefined}>
        {value?.trim() ? value : '—'}
      </p>
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-lg font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

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

  const inits =
    practitioner.initials?.slice(0, 2).toUpperCase() ||
    practitioner.name.slice(0, 2).toUpperCase() ||
    '?';
  const toggling = deactivate.isPending || reactivate.isPending;
  const titleName = practitioner.title
    ? `${practitioner.title} ${practitioner.name}`
    : practitioner.name;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => router.push(ROUTES.PRACTITIONERS)}
        >
          <ArrowLeft className="mr-1.5 size-4" />
          Back to Practitioners
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={toggling}
            onClick={() =>
              practitioner.isActive
                ? deactivate.mutate(practitioner.id)
                : reactivate.mutate(practitioner.id)
            }
          >
            {practitioner.isActive ? (
              <>
                <UserX className="mr-1.5 size-3.5" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="mr-1.5 size-3.5" />
                Reactivate
              </>
            )}
          </Button>
          <Button size="sm" asChild>
            <Link href={ROUTES.PRACTITIONERS_EDIT(practitioner.id)}>
              <Pencil className="mr-1.5 size-3.5" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <Avatar className="size-20" size="lg">
            {practitioner.imageUrl ? (
              <AvatarImage src={practitioner.imageUrl} alt={practitioner.name} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
              {inits}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-heading text-xl font-semibold tracking-tight">
                {titleName}
              </h2>
              <Badge variant={practitioner.isActive ? 'secondary' : 'outline'}>
                {practitioner.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {practitioner.employmentType ? (
                <Badge variant="outline" className="font-normal">
                  {employmentLabel(practitioner.employmentType)}
                </Badge>
              ) : null}
            </div>
            {practitioner.nameAr ? (
              <p className="text-sm text-muted-foreground" dir="rtl">
                {practitioner.nameAr}
              </p>
            ) : null}
            <p className="truncate text-sm text-muted-foreground">
              {practitioner.email}
              {practitioner.phone ? ` · ${practitioner.phone}` : ''}
            </p>
          </div>
        </CardContent>
        <Separator />
        <div className="flex divide-x divide-border/70">
          <HeaderStat label="Services" value={String(practitioner.services.length)} />
          <HeaderStat label="Buffer" value={`${practitioner.bufferMins}m`} />
          <HeaderStat
            label="Experience"
            value={
              practitioner.experienceYears != null
                ? `${practitioner.experienceYears} yrs`
                : '—'
            }
          />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoField label="Department" value={practitioner.departmentName} />
            <InfoField label="Default room" value={practitioner.defaultRoomName} />
            <InfoField
              label="Employment"
              value={employmentLabel(practitioner.employmentType)}
            />
            <InfoField
              label="Commission"
              value={
                practitioner.commissionPercent != null
                  ? `${practitioner.commissionPercent}%`
                  : null
              }
            />
            <InfoField label="License" value={practitioner.licenseNumber} />
            <InfoField
              label="License expiry"
              value={
                practitioner.licenseExpiry
                  ? format(new Date(practitioner.licenseExpiry), 'MMM d, yyyy')
                  : null
              }
            />
            <InfoField
              label="Date of birth"
              value={
                practitioner.dob
                  ? format(new Date(practitioner.dob), 'MMM d, yyyy')
                  : null
              }
            />
            <InfoField
              label="Joined"
              value={format(new Date(practitioner.createdAt), 'MMM d, yyyy')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {practitioner.bio?.trim() || '—'}
            </p>
            {practitioner.bioAr?.trim() ? (
              <p
                className="text-sm whitespace-pre-wrap text-muted-foreground"
                dir="rtl"
              >
                {practitioner.bioAr}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Services</CardTitle>
        </CardHeader>
        <CardContent>
          {practitioner.services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {practitioner.services.map((s) => (
                <Badge key={s.id} variant="secondary" className="font-normal">
                  {s.name}
                  <span className="ml-1.5 text-muted-foreground">
                    {s.durationMins}m
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Weekly availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {practitioner.availabilities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No weekly patterns.</p>
            ) : (
              practitioner.availabilities.map((a, i) => (
                <div
                  key={a.id ?? `${a.dayOfWeek}-${i}`}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <span className="font-medium">
                    {WEEKDAY_OPTIONS[a.dayOfWeek] ?? `Day ${a.dayOfWeek}`}
                  </span>
                  <span className="text-muted-foreground">
                    {a.startTime} – {a.endTime}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Leave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {practitioner.timeOffs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leave blocks.</p>
            ) : (
              practitioner.timeOffs.map((t, i) => (
                <div
                  key={t.id ?? `${t.startDate}-${i}`}
                  className="rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <p className="font-medium">
                    {format(new Date(t.startDate), 'MMM d, yyyy')} –{' '}
                    {format(new Date(t.endDate), 'MMM d, yyyy')}
                  </p>
                  {t.reason ? (
                    <p className="text-muted-foreground">{t.reason}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
