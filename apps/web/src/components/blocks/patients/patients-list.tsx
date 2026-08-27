'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Switch,
  Badge,
} from '@/components/ui';
import {
  PreviewableAvatar,
  isRowControlClick,
  PhoneLink,
  EmailLink,
  TruncatedText,
  Pagination,
  EmptyState,
  MetaStat,
  TableSkeleton,
  RowActionsMenu,
  SoftTip,
} from '@/components/primitives';
import { TableFrame } from '@/components/blocks/data';
import {
  TwoStepDeleteDialogs,
  useTwoStepDelete,
} from '@/components/blocks/feedback';
import { format } from 'date-fns';
import { useTogglePatientStatus, useDeletePatient } from '@/hooks/api/use-patients';
import type { Patient } from '@/services/patients.service';
import { genderLabel, patientAgeLabel } from '@/constants/patient';
import { IconActivate, IconDeactivate, IconDelete, IconEdit, IconLoyal, IconPatients, IconPhone, IconView } from '@/constants/icons';

const PAGE_SIZE = 15;

interface Props {
  patients: Patient[] | undefined;
  isLoading: boolean;
  clinicId: string;
  hasActiveFilters?: boolean;
  emptyAction?: React.ReactNode;
}

function patientName(p: Patient) {
  return `${p.firstNameEn} ${p.lastNameEn}`.trim();
}

function visit(date: string | null) {
  return date ? format(new Date(date), 'MMM d, yyyy') : '—';
}

export function PatientsList({
  patients,
  isLoading,
  clinicId,
  hasActiveFilters = false,
  emptyAction,
}: Props) {
  const router = useRouter();
  const toggleStatus = useTogglePatientStatus(clinicId);
  const deleteMutation = useDeletePatient(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();
  const [page, setPage] = useState(1);

  const totalItems = patients?.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  const [prevPatients, setPrevPatients] = useState(patients);
  if (patients !== prevPatients) {
    setPrevPatients(patients);
    setPage(1);
  }

  const pageItems = useMemo(() => {
    if (!patients) return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return patients.slice(start, start + PAGE_SIZE);
  }, [patients, currentPage]);

  const openPatient = (id: string) => router.push(`/patients/${id}`);

  const rowMenu = (p: Patient, fullName: string) => (
    <RowActionsMenu
      items={[
        { label: 'View', icon: IconView, href: `/patients/${p.id}` },
        { label: 'Edit', icon: IconEdit, href: `/patients/${p.id}/edit` },
        {
          label: p.isActive ? 'Deactivate' : 'Reactivate',
          icon: p.isActive ? IconDeactivate : IconActivate,
          disabled: toggleStatus.isPending,
          onSelect: () =>
            toggleStatus.mutate({ id: p.id, isActive: !p.isActive }),
        },
        {
          label: 'Delete',
          icon: IconDelete,
          variant: 'destructive',
          onSelect: () => del.ask({ id: p.id, name: fullName }),
        },
      ]}
    />
  );

  if (isLoading) {
    return <TableSkeleton rows={8} cols={6} hasHeader={false} />;
  }

  if (!patients || patients.length === 0) {
    return (
      <TableFrame>
        <EmptyState
          icon={IconPatients}
          title={hasActiveFilters ? 'No matches' : 'No patients'}
          description={
            hasActiveFilters
              ? 'Try adjusting your search or filters.'
              : 'Create a patient to start booking visits and tracking care.'
          }
          action={hasActiveFilters ? undefined : emptyAction}
        />
      </TableFrame>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <TableFrame>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Patient</TableHead>
                <TableHead className="hidden lg:table-cell w-[12%]">National ID</TableHead>
                <TableHead className="w-[13%]">Phone</TableHead>
                <TableHead className="w-[8%]">Gender</TableHead>
                <TableHead className="w-[8%]">Age</TableHead>
                <TableHead className="hidden lg:table-cell w-[14%]">Practitioner</TableHead>
                <TableHead className="w-[8%]">Sessions</TableHead>
                <TableHead className="hidden xl:table-cell w-[11%]">Last Visit</TableHead>
                <TableHead className="w-[8%]">Active</TableHead>
                <TableHead className="w-[8%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((p) => {
                const fullName = patientName(p);
                return (
                  <TableRow
                    key={p.id}
                    className={`cursor-pointer ${!p.isActive ? 'opacity-60' : ''}`}
                    onClick={(e) => {
                      if (isRowControlClick(e)) return;
                      openPatient(p.id);
                    }}
                  >
                    <TableCell className="max-w-0 overflow-hidden">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <PreviewableAvatar
                          src={p.imageUrl}
                          seed={p.id}
                          alt={fullName}
                          size="sm"
                        />
                        <span className="flex min-w-0 items-center gap-1.5 font-medium">
                          <TruncatedText className="font-medium">{fullName}</TruncatedText>
                          {p.isLoyal && (
                            <SoftTip label="Loyal patient">
                              <IconLoyal className="size-3.5 shrink-0 fill-warning text-warning" />
                            </SoftTip>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-0 overflow-hidden text-muted-foreground">
                      <TruncatedText>{p.nationalId ?? '—'}</TruncatedText>
                    </TableCell>
                    <TableCell
                      className="max-w-0 overflow-hidden text-muted-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PhoneLink value={p.phone} className="block" />
                    </TableCell>
                    <TableCell>
                      {genderLabel(p.gender) ? (
                        <SoftTip label={genderLabel(p.gender)}>
                          <Badge variant="outline" className="font-normal">
                            {genderLabel(p.gender)}
                          </Badge>
                        </SoftTip>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {patientAgeLabel(p.dob) || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-0 overflow-hidden text-muted-foreground">
                      <TruncatedText>{p.primaryDoctorName ?? '—'}</TruncatedText>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.totalSessions}</TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">
                      {visit(p.lastVisit)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={p.isActive}
                        disabled={toggleStatus.isPending}
                        onCheckedChange={(checked) =>
                          toggleStatus.mutate({ id: p.id, isActive: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {rowMenu(p, fullName)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableFrame>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:hidden">
        {pageItems.map((p) => {
          const fullName = patientName(p);
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                if (isRowControlClick(e)) return;
                openPatient(p.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openPatient(p.id);
                }
              }}
              className={`cursor-pointer rounded-xl bg-card p-3 ring-1 ring-foreground/10 ${
                !p.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <PreviewableAvatar src={p.imageUrl} seed={p.id} alt={fullName} />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5 font-medium">
                    <TruncatedText className="font-medium">{fullName}</TruncatedText>
                    {p.isLoyal && (
                      <SoftTip label="Loyal patient">
                        <IconLoyal className="size-3.5 shrink-0 fill-warning text-warning" />
                      </SoftTip>
                    )}
                  </div>
                  {genderLabel(p.gender) || patientAgeLabel(p.dob) ? (
                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                      {genderLabel(p.gender) ? (
                        <SoftTip label={genderLabel(p.gender)}>
                          <Badge variant="outline" className="font-normal">
                            {genderLabel(p.gender)}
                          </Badge>
                        </SoftTip>
                      ) : null}
                      {patientAgeLabel(p.dob) ? (
                        <span className="text-xs text-muted-foreground">
                          {patientAgeLabel(p.dob)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div
                    className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconPhone className="size-3 shrink-0" />
                    <PhoneLink value={p.phone} empty="No phone" className="min-w-0" />
                  </div>
                </div>
                <div
                  className="flex shrink-0 items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Switch
                    checked={p.isActive}
                    disabled={toggleStatus.isPending}
                    onCheckedChange={(checked) =>
                      toggleStatus.mutate({ id: p.id, isActive: checked })
                    }
                  />
                  {rowMenu(p, fullName)}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-2.5 text-xs">
                <MetaStat label="National ID" value={p.nationalId ?? '—'} />
                <MetaStat label="Practitioner" value={p.primaryDoctorName ?? '—'} />
                <MetaStat label="Sessions" value={String(p.totalSessions)} />
                <MetaStat label="Last visit" value={visit(p.lastVisit)} />
              </div>
            </div>
          );
        })}
      </div>

      <Pagination
        page={currentPage}
        pageCount={pageCount}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      <TwoStepDeleteDialogs
        step1={del.step1}
        step2={del.step2}
        onStep1OpenChange={(open) => !open && del.cancelStep1()}
        onStep2OpenChange={(open) => !open && del.cancelStep2()}
        onContinue={del.advance}
        onConfirm={() => {
          if (!del.step2) return;
          deleteMutation.mutate(del.step2.id, { onSuccess: del.clear });
        }}
        isPending={deleteMutation.isPending}
        warning="This permanently removes the patient and their visit history. This cannot be undone. To just hide the patient, use Deactivate instead."
        finalWarning="This permanently deletes the patient and every appointment linked to them. This action cannot be undone."
        confirmLabel="Yes, delete patient"
      />
    </>
  );
}
