'use client';

import Link from 'next/link';
import { useDebounce } from '@/hooks/shared/use-debounce';
import { Button } from '@/components/ui';
import { IconNewPatient } from '@/constants/icons';
import { usePatients } from '@/hooks/api/use-patients';
import { useDepartments } from '@/hooks/api/use-departments';
import { useClinicStaff } from '@/hooks/api/use-clinic-staff';
import {
  PatientFiltersBlock,
  type PatientFilterState,
  PatientsList,
} from '@/components/blocks/patients';
import { ExportFormatButton } from '@/components/blocks/reports';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { DEFAULT_PATIENT_SORT, parsePatientSort } from '@/constants/patient';
import { useSessionStorageState } from '@/hooks/shared/use-session-storage-state';
import { exportPatients } from '@/lib/export-patients';
import { toast } from 'sonner';

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

  const patchFilters = (patch: Partial<PatientFilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const resetFilters = () =>
    setFilters((prev) => ({
      ...INITIAL_FILTERS,
      search: prev.search,
      sort: prev.sort,
    }));

  const handleExport = (format: Parameters<typeof exportPatients>[1]) => {
    if (!patients?.length) {
      toast.error('No patients to export for the current filters');
      return;
    }
    exportPatients(patients, format);
    toast.success(
      format === 'pdf'
        ? 'Print dialog opened - choose Save as PDF'
        : `Downloaded ${patients.length} patient${patients.length === 1 ? '' : 's'}`,
    );
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
    <div className="space-y-4">
      <PatientFiltersBlock
        values={filters}
        onChange={patchFilters}
        onReset={resetFilters}
        staff={staff}
        departments={departments}
        trailing={
          <>
            <ExportFormatButton
              className="shrink-0"
              disabled={isLoading || !patients?.length}
              onSelect={handleExport}
            />
            <Button asChild className="h-8 shrink-0 rounded-lg">
              <Link href="/patients/new">
                <IconNewPatient className="size-4" />
                Add Patient
              </Link>
            </Button>
          </>
        }
      />

      <PatientsList
        patients={patients}
        isLoading={isLoading}
        clinicId={clinicId}
        hasActiveFilters={hasActiveFilters}
        emptyAction={
          <Button asChild>
            <Link href="/patients/new">Create patient</Link>
          </Button>
        }
      />
    </div>
  );
}
