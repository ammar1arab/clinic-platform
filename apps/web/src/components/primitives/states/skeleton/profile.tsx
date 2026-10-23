'use client';

import { Card, CardContent, Skeleton } from '@/components/ui';
import { ProfileInfoGrid, ProfileSection, ProfileShell } from '../../display/profile-chrome';
import { EntityMobileCard } from '../../display/entity-mobile-card';
import { TableSkeleton } from './presets';

export function DirectoryViewSkeleton({ variant, canManage = true }: { variant: 'patient' | 'practitioner'; canManage?: boolean }) {
  const patient = variant === 'patient';
  return <div className="page-fill-always" aria-busy="true">
    <TableSkeleton className="page-fill hidden lg:flex" rows={20} cols={patient ? 6 : 10} hasHeader={false} />
    <div className="page-fill-always gap-3 lg:hidden">
      {[0, 1, 2, 3].map((index) => <EntityMobileCard key={index}
        avatar={<Skeleton className="size-8 shrink-0 rounded-full" />}
        title={<Skeleton className="h-5 w-40 max-w-full" />}
        subtitle={<Skeleton className="h-4 w-56 max-w-full" />}
        tags={<Skeleton className="h-5 w-20 rounded-full" />}
        actions={canManage ? <div className="flex items-center gap-2"><Skeleton className="h-5 w-9 rounded-full" /><Skeleton className="size-6 rounded-md" /></div> : undefined}
        meta={Array.from({ length: patient ? 4 : 6 }, (_, field) => <div key={field} className="min-w-0 space-y-1"><Skeleton className="h-3.5 w-20 max-w-full" /><Skeleton className="h-4 w-28 max-w-full" /></div>)}
        footer={patient ? <div className="flex items-center justify-between gap-3"><Skeleton className="h-4 w-10" /><Skeleton className="h-4 w-32" /></div> : undefined}
      />)}
    </div>
  </div>;
}

function InfoSkeleton({ fields }: { fields: number }) {
  return (
    <ProfileInfoGrid className="lg:grid-cols-3">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-3 py-2.5 sm:flex-col sm:items-stretch sm:gap-1 sm:py-0">
          <Skeleton className="h-4 w-24 shrink-0" />
          <Skeleton className="h-5 w-32 max-w-[58%] sm:max-w-full" />
        </div>
      ))}
    </ProfileInfoGrid>
  );
}

function SectionSkeleton({ badges = false, summary = false }: { badges?: boolean; summary?: boolean }) {
  return (
    <ProfileSection title={<Skeleton className="h-6 w-32" />} className="h-full" contentClassName="space-y-1.5">
      {summary ? <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5"><Skeleton className="h-4 w-40 max-w-[75%]" /><Skeleton className="size-5 rounded-full" /></div> : null}
      {badges ? (
        <div className="flex flex-wrap gap-2">{[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-6 w-24 rounded-full" />)}</div>
      ) : [0, 1, 2].map((index) => (
        <div key={index} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
          <div className="min-w-0 flex-1 space-y-1"><Skeleton className="h-5 w-36 max-w-full" /><Skeleton className="h-4 w-48 max-w-full" /></div>
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </ProfileSection>
  );
}

export function ProfileViewSkeleton({ variant, backHref, canManage = true }: { variant: 'patient' | 'practitioner' | 'self'; backHref: string; canManage?: boolean }) {
  const self = variant === 'self';
  const patient = variant === 'patient';
  return (
    <ProfileShell backHref={backHref} actions={canManage ? <div className="flex items-center gap-2">{patient ? <Skeleton className="size-8 rounded-lg" /> : null}<Skeleton className={self ? 'h-8 w-20 rounded-lg' : 'size-8 rounded-lg'} /></div> : undefined}>
      <div className="space-y-4" aria-busy="true" aria-hidden="true">
        <Card className="card-aura overflow-hidden ring-0">
          <CardContent className="flex items-center gap-3 p-4 sm:gap-5 sm:p-5">
            <Skeleton className="size-20 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-6 w-40 max-w-full sm:h-7" />
              {!patient ? <Skeleton className="h-4 w-32 max-w-full sm:h-5" /> : null}
              <Skeleton className="h-4 w-56 max-w-full sm:h-5" />
            </div>
          </CardContent>
          {!self ? <div className="grid grid-cols-3 border-t border-border/70">{[0, 1, 2].map((index) => <div key={index} className="flex flex-col items-center gap-0.5 px-2 py-2 sm:px-3 sm:py-2.5"><Skeleton className="h-4 w-12" /><Skeleton className="h-3 w-16 max-w-full" /></div>)}</div> : null}
        </Card>
        <ProfileSection title={<Skeleton className="h-6 w-32" />}><InfoSkeleton fields={patient ? 10 : self ? 9 : 13} /></ProfileSection>
        {patient ? <><SectionSkeleton /><SectionSkeleton /></> : <>
          {!self ? <ProfileSection title={<Skeleton className="h-6 w-32" />}><Skeleton className="h-16 w-full" /></ProfileSection> : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionSkeleton badges={self} />
            <SectionSkeleton />
            <SectionSkeleton />
            <SectionSkeleton summary />
            <SectionSkeleton />
          </div>
          {self ? <Card className="gap-0 py-0"><CardContent className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5"><Skeleton className="h-6 w-36" /><Skeleton className="h-8 w-full rounded-lg sm:w-64" /></CardContent></Card> : null}
        </>}
      </div>
    </ProfileShell>
  );
}
