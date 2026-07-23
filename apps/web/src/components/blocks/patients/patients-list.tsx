'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TruncatedText } from '@/components/primitives/truncated-text';
import { Pagination } from '@/components/primitives/pagination';
import { TableFrame } from '@/components/blocks/data/table-frame';
import { EmptyState } from '@/components/primitives/empty-state';
import { SectionLoader } from '@/components/primitives/spinner';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/blocks/feedback';
import {
  IconDelete,
  IconEdit,
  IconLoyal,
  IconPatients,
  IconPhone,
} from '@/constants/icons';
import { format } from 'date-fns';
import { useTogglePatientStatus, useDeletePatient } from '@/hooks/use-patients';
import type { Patient } from '@/services/patients.service';

const PAGE_SIZE = 15;

interface Props {
  patients: Patient[] | undefined;
  isLoading: boolean;
  clinicId: string;
}

function initials(p: Patient) {
  return `${p.firstNameEn?.[0] ?? ''}${p.lastNameEn?.[0] ?? ''}`.toUpperCase() || '?';
}

function patientName(p: Patient) {
  return `${p.firstNameEn} ${p.lastNameEn}`.trim();
}

function visit(date: string | null) {
  return date ? format(new Date(date), 'MMM d, yyyy') : '—';
}

export function PatientsList({ patients, isLoading, clinicId }: Props) {
  const router = useRouter();
  const toggleStatus = useTogglePatientStatus(clinicId);
  const deleteMutation = useDeletePatient(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();
  const [page, setPage] = useState(1);

  const totalItems = patients?.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  useEffect(() => {
    setPage(1);
  }, [patients]);

  const pageItems = useMemo(() => {
    if (!patients) return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return patients.slice(start, start + PAGE_SIZE);
  }, [patients, currentPage]);

  const openPatient = (id: string) => router.push(`/patients/${id}`);

  if (isLoading) {
    return (
      <TableFrame>
        <SectionLoader label="Loading patients…" />
      </TableFrame>
    );
  }

  if (!patients || patients.length === 0) {
    return (
      <TableFrame>
        <EmptyState
          icon={IconPatients}
          title="No patients found"
          description="Try adjusting your search or filters."
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
                <TableHead className="w-[24%]">Patient</TableHead>
                <TableHead className="hidden md:table-cell w-[14%]">National ID</TableHead>
                <TableHead className="w-[14%]">Phone</TableHead>
                <TableHead className="hidden lg:table-cell w-[16%]">Practitioner</TableHead>
                <TableHead className="w-[10%]">Sessions</TableHead>
                <TableHead className="hidden xl:table-cell w-[12%]">Last Visit</TableHead>
                <TableHead className="w-[10%]">Active</TableHead>
                <TableHead className="w-[10%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((p) => {
                const fullName = patientName(p);
                return (
                  <TableRow
                    key={p.id}
                    className={`cursor-pointer ${!p.isActive ? 'opacity-60' : ''}`}
                    onClick={() => openPatient(p.id)}
                  >
                    <TableCell className="max-w-0 overflow-hidden">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback>{initials(p)}</AvatarFallback>
                        </Avatar>
                        <span className="flex min-w-0 items-center gap-1.5 font-medium">
                          <TruncatedText className="font-medium">{fullName}</TruncatedText>
                          {p.isLoyal && (
                            <IconLoyal className="size-3.5 shrink-0 fill-warning text-warning" />
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-0 overflow-hidden text-muted-foreground">
                      <TruncatedText>{p.nationalId ?? '—'}</TruncatedText>
                    </TableCell>
                    <TableCell className="max-w-0 overflow-hidden text-muted-foreground">
                      <TruncatedText>{p.phone ?? '—'}</TruncatedText>
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
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => router.push(`/patients/${p.id}/edit`)}
                        >
                          <IconEdit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => del.ask({ id: p.id, name: fullName })}
                        >
                          <IconDelete className="size-3.5" />
                        </Button>
                      </div>
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
              onClick={() => openPatient(p.id)}
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
                <Avatar>
                  <AvatarFallback>{initials(p)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5 font-medium">
                    <TruncatedText className="font-medium">{fullName}</TruncatedText>
                    {p.isLoyal && (
                      <IconLoyal className="size-3.5 shrink-0 fill-warning text-warning" />
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <IconPhone className="size-3" />
                    <TruncatedText>{p.phone ?? 'No phone'}</TruncatedText>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => router.push(`/patients/${p.id}/edit`)}
                  >
                    <IconEdit className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => del.ask({ id: p.id, name: fullName })}
                  >
                    <IconDelete className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-2.5 text-xs sm:grid-cols-3">
                <Stat label="National ID" value={p.nationalId ?? '—'} />
                <Stat label="Practitioner" value={p.primaryDoctorName ?? '—'} />
                <Stat label="Sessions" value={String(p.totalSessions)} />
                <Stat label="Last Visit" value={visit(p.lastVisit)} className="sm:col-span-2" />
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
        warning="This permanently removes the patient and their visit history. This cannot be undone. To just hide the patient, use the Active toggle instead."
        finalWarning="This permanently deletes the patient and every appointment linked to them. This action cannot be undone."
        confirmLabel="Yes, delete patient"
      />
    </>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className ?? ''}`}>
      <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate font-medium">{value}</p>
    </div>
  );
}
