'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { PractitionerFiltersBlock, PractitionersList } from '@/components/blocks/practitioners';
import { ROUTES } from '@/constants/routes';
import {
  applyPractitionerDirectory,
  INITIAL_PRACTITIONER_FILTERS,
  type PractitionerFilterState,
} from '@/constants/practitioner';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useDebounce } from '@/hooks/shared/use-debounce';
import { useDepartments } from '@/hooks/api/use-departments';
import { usePractitioners } from '@/hooks/api/use-practitioners';
import { useRooms } from '@/hooks/api/use-rooms';
import { useSessionStorageState } from '@/hooks/shared/use-session-storage-state';
import { exportPractitioners } from '@/lib/export-practitioners';
import { toast } from 'sonner';

const PAGE_SIZE = 15;

export default function PractitionersPage() {
  const clinicId = useClinicId();
  const [filters, setFilters] = useSessionStorageState<PractitionerFilterState>(
    `practitioners-filters:${clinicId || 'none'}`,
    INITIAL_PRACTITIONER_FILTERS,
  );
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(filters.search);
  const { data: practitioners, isLoading } = usePractitioners(clinicId);
  const { data: departments } = useDepartments(clinicId);
  const { data: rooms } = useRooms(clinicId);

  const filtered = useMemo(
    () =>
      applyPractitionerDirectory(practitioners, {
        ...filters,
        search: debouncedSearch,
      }),
    [practitioners, filters, debouncedSearch],
  );

  const [prevFiltered, setPrevFiltered] = useState(filtered);
  if (filtered !== prevFiltered) {
    setPrevFiltered(filtered);
    setPage(1);
  }

  const totalItems = filtered.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const patchFilters = (patch: Partial<PractitionerFilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const resetFilters = () =>
    setFilters((prev) => ({
      ...INITIAL_PRACTITIONER_FILTERS,
      search: prev.search,
      sort: prev.sort,
    }));

  const handleExport = (format: Parameters<typeof exportPractitioners>[1]) => {
    if (!filtered.length) {
      toast.error('No practitioners to export for the current filters');
      return;
    }
    exportPractitioners(filtered, format);
    toast.success(
      format === 'pdf'
        ? 'Print dialog opened - choose Save as PDF'
        : `Downloaded ${filtered.length} practitioner${filtered.length === 1 ? '' : 's'}`,
    );
  };

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
    <div className="space-y-4">
      <PractitionerFiltersBlock
        values={filters}
        onChange={patchFilters}
        onReset={resetFilters}
        practitioners={practitioners}
        departments={departments}
        rooms={rooms}
        exportDisabled={isLoading || !filtered.length}
        onExport={handleExport}
      />

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
