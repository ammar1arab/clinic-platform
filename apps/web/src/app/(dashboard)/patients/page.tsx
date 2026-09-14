'use client';

import Link from 'next/link';
import { useDebounce } from '@/hooks/shared/use-debounce';
import { Button } from '@/components/ui';
import { usePatients } from '@/hooks/api/use-patients';
import { useDepartments } from '@/hooks/api/use-departments';
import { useClinicStaff } from '@/hooks/api/use-clinic-staff';
import {
  PatientFiltersBlock,
  type PatientFilterState,
  PatientsList,
} from '@/components/blocks/patients';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { DEFAULT_PATIENT_SORT, parsePatientSort } from '@/constants/patient';
import { ROUTES } from '@/constants/routes';
import { useDownloadPatientsDirectory } from '@/hooks/api/use-reports';
import { useSessionStorageState } from '@/hooks/shared/use-session-storage-state';
import { toast } from 'sonner';
import type { ReportFormat } from '@/services/reports.service';

const INITIAL_FILTERS: PatientFilterState = {
  search: '',
  status: 'all',
  gender: '',
  bloodType: '',
  primaryDoctorId: '',
  departmentId: '',
  visitFrom: '',
  visitTo: '',
  dobFrom: '',
  dobTo: '',
  sort: DEFAULT_PATIENT_SORT,
};

export default function PatientsPage() {
  const clinicId = useClinicId();
  const [filters, setFilters] = useSessionStorageState<PatientFilterState>(
    `patients-filters:${clinicId || 'none'}`,
    INITIAL_FILTERS,
  );

  const debouncedSearch = useDebounce(filters.search);
  const { sortBy, sortOrder } = parsePatientSort(filters.sort);
  const { data: departments } = useDepartments(clinicId);
  const { data: staff } = useClinicStaff(clinicId);

  const { data: patients, isLoading } = usePatients({
    clinicId,
    search: debouncedSearch || undefined,
    isActive: filters.status === 'all' ? undefined : filters.status === 'active',
    gender: filters.gender || undefined,
    bloodType: filters.bloodType || undefined,
    primaryDoctorId: filters.primaryDoctorId || undefined,
    departmentId: filters.departmentId || undefined,
    visitFrom: filters.visitFrom || undefined,
    visitTo: filters.visitTo || undefined,
    dobFrom: filters.dobFrom || undefined,
    dobTo: filters.dobTo || undefined,
    sortBy,
    sortOrder,
  });
  const downloadDirectory = useDownloadPatientsDirectory(clinicId);

  const patchFilters = (patch: Partial<PatientFilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const resetFilters = () =>
    setFilters((prev) => ({
      ...INITIAL_FILTERS,
      search: prev.search,
      sort: prev.sort,
    }));

  const handleExport = (format: ReportFormat) => {
    if (!patients?.length) {
      toast.error('No patients to export for the current filters');
      return;
    }
    downloadDirectory.mutate({
      format,
      search: debouncedSearch || undefined,
      status: filters.status,
      gender: filters.gender || undefined,
      bloodType: filters.bloodType || undefined,
      primaryDoctorId: filters.primaryDoctorId || undefined,
      departmentId: filters.departmentId || undefined,
      visitFrom: filters.visitFrom || undefined,
      visitTo: filters.visitTo || undefined,
      dobFrom: filters.dobFrom || undefined,
      dobTo: filters.dobTo || undefined,
      sortBy,
      sortOrder,
    });
  };

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    filters.status !== 'all' ||
    Boolean(filters.gender) ||
    Boolean(filters.bloodType) ||
    Boolean(filters.primaryDoctorId) ||
    Boolean(filters.departmentId) ||
    Boolean(filters.visitFrom) ||
    Boolean(filters.visitTo) ||
    Boolean(filters.dobFrom) ||
    Boolean(filters.dobTo);

  return (
    <div className="page-fill gap-4">
      <div className="shrink-0">
        <PatientFiltersBlock
          values={filters}
          onChange={patchFilters}
          onReset={resetFilters}
          staff={staff}
          departments={departments}
          exportDisabled={isLoading || downloadDirectory.isPending || !patients?.length}
          onExport={handleExport}
        />
      </div>

      <PatientsList
        patients={patients}
        isLoading={isLoading}
        clinicId={clinicId}
        hasActiveFilters={hasActiveFilters}
        emptyAction={
          <Button asChild>
            <Link href={ROUTES.PATIENT_NEW}>Create patient</Link>
          </Button>
        }
      />
    </div>
  );
}
