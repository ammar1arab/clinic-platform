'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/primitives/search-input';
import { PractitionersList } from '@/components/blocks/practitioners/practitioners-list';
import { IconAdd } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { useClinicId } from '@/hooks/use-clinic-id';
import { useListFilter } from '@/hooks/use-list-filter';
import { usePractitioners } from '@/hooks/use-practitioners';
import type { Practitioner } from '@/services/practitioners.service';

const searchFields = (p: Practitioner): string[] =>
  [p.name, p.nameAr, p.email, p.phone, p.departmentName, p.licenseNumber].filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  );

export default function PractitionersPage() {
  const clinicId = useClinicId();
  const { data: practitioners, isLoading } = usePractitioners(clinicId);
  const {
    search,
    setSearch,
    page,
    setPage,
    pageCount,
    pageItems,
    totalItems,
    pageSize,
  } = useListFilter(practitioners, searchFields, 15);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search practitioners…"
          className="sm:max-w-xs"
        />
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href={ROUTES.PRACTITIONERS_NEW}>
            <IconAdd className="size-4" />
            New practitioner
          </Link>
        </Button>
      </div>

      <PractitionersList
        pageItems={pageItems}
        isLoading={isLoading}
        clinicId={clinicId}
        search={search}
        page={page}
        pageCount={pageCount}
        totalItems={totalItems}
        pageSize={pageSize}
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
