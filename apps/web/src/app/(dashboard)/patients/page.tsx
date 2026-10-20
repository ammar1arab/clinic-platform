'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/primitives';
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
import { ROLE } from '@clinic/types';
import { useAuth, useLanguage } from '@/providers';
import { IconPatients } from '@/constants/icons';

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
  const { user } = useAuth();
  const { t } = useLanguage();
  const isPractitioner = user?.role === ROLE.PRACTITIONER;
  const [filters, setFilters] = useSessionStorageState<PatientFilterState>(
    `patients-filters:${clinicId || 'none'}`,
    INITIAL_FILTERS,
  );

  const { sortBy, sortOrder } = parsePatientSort(filters.sort);
  const { data: departments } = useDepartments(clinicId);
  const { data: staff } = useClinicStaff(clinicId);

  const { data: patients, isLoading, isPlaceholderData, isError, refetch } = usePatients({
    clinicId,
    search: filters.search || undefined,
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
  }, { enabled: !!user });
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
      search: filters.search || undefined,
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

  const searchLoading =
    isLoading || isPlaceholderData;

  const hasActiveFilters =
    Boolean(filters.search) ||
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
    <div className="page-fill gap-2.5">
      <div className="shrink-0">
        <PatientFiltersBlock
          values={filters}
          onChange={patchFilters}
          onReset={resetFilters}
          staff={staff}
          departments={departments}
          exportDisabled={searchLoading || downloadDirectory.isPending || !patients?.length}
          onExport={handleExport}
          searchLoading={searchLoading}
          canManage={!isPractitioner}
        />
      </div>

      {isError && !patients ? (
        <ErrorState onRetry={() => void refetch()} className="page-fill" />
      ) : !searchLoading && patients?.length === 0 ? (
        <EmptyState
          icon={IconPatients}
          title={hasActiveFilters ? t.patient.noMatches : t.patient.noPatients}
          description={hasActiveFilters ? t.patient.noMatchesDesc : t.patient.noPatientsDesc}
          className="page-fill"
          action={!isPractitioner ? <Button asChild><Link href={ROUTES.PATIENT_NEW}>Create patient</Link></Button> : undefined}
        />
      ) : (
        <PatientsList
          patients={patients}
          isLoading={searchLoading}
          hasActiveFilters={hasActiveFilters}
          canManage={!isPractitioner}
          emptyAction={
            <Button asChild>
              <Link href={ROUTES.PATIENT_NEW}>Create patient</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
