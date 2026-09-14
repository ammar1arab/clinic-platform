'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { PractitionerFiltersBlock, PractitionersList } from '@/components/blocks/practitioners';
import { ROUTES } from '@/constants/routes';
import {
  INITIAL_PRACTITIONER_FILTERS,
  type PractitionerFilterState,
} from '@/constants/practitioner';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useDebounce } from '@/hooks/shared/use-debounce';
import { useDepartments } from '@/hooks/api/use-departments';
import {
  usePractitionerDirectory,
  usePractitioners,
} from '@/hooks/api/use-practitioners';
import { useRooms } from '@/hooks/api/use-rooms';
import { useDownloadPractitionersDirectory } from '@/hooks/api/use-reports';
import { useSessionStorageState } from '@/hooks/shared/use-session-storage-state';
import { toast } from 'sonner';
import type {
  Practitioner,
  PractitionerFilters,
} from '@/services/practitioners.service';
import type { ReportFormat } from '@/services/reports.service';

const PAGE_SIZE = 15;
const EMPTY_DIRECTORY: Practitioner[] = [];

function toDirectoryQuery(
  clinicId: string,
  search: string,
  filters: PractitionerFilterState,
): PractitionerFilters {
  return {
    clinicId,
    search: search || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
    departmentId: filters.departmentId || undefined,
    employmentType: filters.employmentType || undefined,
    gender: filters.gender || undefined,
    language: filters.language || undefined,
    specialty: filters.specialty || undefined,
    roomId: filters.roomId || undefined,
    nationality: filters.nationality || undefined,
    license: filters.license === 'all' ? undefined : filters.license,
    experience: filters.experience === 'all' ? undefined : filters.experience,
    sort: filters.sort,
  };
}

function filterResetKey(search: string, filters: PractitionerFilterState) {
  return [
    search,
    filters.status,
    filters.departmentId,
    filters.employmentType,
    filters.gender,
    filters.language,
    filters.specialty,
    filters.roomId,
    filters.nationality,
    filters.license,
    filters.experience,
    filters.sort,
  ].join('|');
}

export default function PractitionersPage() {
  const clinicId = useClinicId();
  const [filters, setFilters] = useSessionStorageState<PractitionerFilterState>(
    `practitioners-filters:${clinicId || 'none'}`,
    INITIAL_PRACTITIONER_FILTERS,
  );
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(filters.search);
  const query = useMemo(
    () => toDirectoryQuery(clinicId, debouncedSearch, filters),
    [clinicId, debouncedSearch, filters],
  );

  const resetKey = filterResetKey(debouncedSearch, filters);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  const { data: catalog } = usePractitioners(clinicId);
  const { data: filtered, isLoading } = usePractitionerDirectory(query);
  const { data: departments } = useDepartments(clinicId);
  const { data: rooms } = useRooms(clinicId);
  const directory = filtered ?? EMPTY_DIRECTORY;
  const downloadDirectory = useDownloadPractitionersDirectory(clinicId);

  const totalItems = directory.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () =>
      directory.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [directory, currentPage],
  );

  const patchFilters = useCallback(
    (patch: Partial<PractitionerFilterState>) =>
      setFilters((prev) => ({ ...prev, ...patch })),
    [setFilters],
  );

  const resetFilters = useCallback(
    () =>
      setFilters((prev) => ({
        ...INITIAL_PRACTITIONER_FILTERS,
        search: prev.search,
        sort: prev.sort,
      })),
    [setFilters],
  );

  const handleExport = useCallback(
    (format: ReportFormat) => {
      if (!directory.length) {
        toast.error('No practitioners to export for the current filters');
        return;
      }
      downloadDirectory.mutate({ format, ...query });
    },
    [directory.length, downloadDirectory, query],
  );

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    filters.status !== 'all' ||
    Boolean(filters.departmentId) ||
    Boolean(filters.employmentType) ||
    Boolean(filters.gender) ||
    Boolean(filters.language) ||
    Boolean(filters.specialty) ||
    Boolean(filters.roomId) ||
    Boolean(filters.nationality) ||
    filters.license !== 'all' ||
    filters.experience !== 'all';

  return (
    <div className="page-fill gap-4">
      <div className="shrink-0">
        <PractitionerFiltersBlock
          values={filters}
          onChange={patchFilters}
          onReset={resetFilters}
          practitioners={catalog}
          departments={departments}
          rooms={rooms}
          exportDisabled={isLoading || downloadDirectory.isPending || !directory.length}
          onExport={handleExport}
        />
      </div>

      <PractitionersList
        pageItems={pageItems}
        isLoading={isLoading}
        clinicId={clinicId}
        hasActiveFilters={hasActiveFilters}
        page={currentPage}
        pageCount={pageCount}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyAction={
          <Button asChild>
            <Link href={ROUTES.PRACTITIONERS_NEW}>Create practitioner</Link>
          </Button>
        }
      />
    </div>
  );
}
