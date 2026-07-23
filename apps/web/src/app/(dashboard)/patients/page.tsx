'use client';

import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconExport, IconNewPatient } from '@/constants/icons';
import { usePatients } from '@/hooks/use-patients';
import { useDepartments } from '@/hooks/use-departments';
import { useClinicStaff } from '@/hooks/use-clinic-staff';
import {
  PatientFiltersBlock,
  PatientFilterState,
} from '@/components/blocks/patients/patient-filters';
import { PatientsList } from '@/components/blocks/patients/patients-list';
import { useClinicId } from '@/hooks/use-clinic-id';
import { DEFAULT_PATIENT_SORT, parsePatientSort } from '@/constants/patient';
import { useSessionStorageState } from '@/hooks/use-session-storage-state';
import { exportPatients, type PatientExportFormat } from '@/lib/export-patients';
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

  const debouncedSearch = useDebounce(filters.search, 350);
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

  const handleExport = (format: PatientExportFormat) => {
    if (!patients?.length) {
      toast.error('No patients to export for the current filters');
      return;
    }
    exportPatients(patients, format);
    toast.success(
      format === 'pdf'
        ? 'Print dialog opened — choose Save as PDF'
        : `Exported ${patients.length} patient${patients.length === 1 ? '' : 's'}`,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PatientFiltersBlock
          values={filters}
          onChange={patchFilters}
          onReset={resetFilters}
          staff={staff}
          departments={departments}
        />
        <div className="flex w-full shrink-0 flex-row gap-2 sm:w-auto">
          <div className="min-w-0 flex-1 sm:flex-none">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading || !patients?.length}
                >
                  <IconExport className="size-4 mr-1.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('docx')}>Word</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>Excel</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button size="sm" asChild className="min-w-0 flex-1 sm:flex-none">
            <Link href="/patients/new">
              <IconNewPatient className="size-4 mr-1.5" />
              Add Patient
            </Link>
          </Button>
        </div>
      </div>

      <PatientsList patients={patients} isLoading={isLoading} clinicId={clinicId} />
    </div>
  );
}
