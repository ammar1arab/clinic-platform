'use client';

import { useRouter } from 'next/navigation';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/primitives';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Switch, Badge } from '@/components/ui';
import {
  PreviewableAvatar, isRowControlClick, EmailLink, PhoneLink, TruncatedText, Pagination, EmptyState, MetaStat, TableSkeleton, RowActionsMenu, SoftTip, TableFrame,
} from '@/components/primitives';
import {
  useDeletePractitioner,
  useDeactivatePractitioner,
  useReactivatePractitioner,
} from '@/hooks/api/use-practitioners';
import type { Practitioner } from '@/services/practitioners.service';
import { IconActivate, IconDeactivate, IconDelete, IconEdit, IconPhone, IconPractitioner, IconView } from '@/constants/icons';
import { useLanguage } from '@/providers';
import { getBilingualName, getStaffName } from '@/i18n';
import { ROUTES } from '@/constants/routes';

function CellBadge({
  value,
  variant = 'secondary',
}: {
  value: string | null | undefined;
  variant?: 'secondary' | 'outline' | 'warning' | 'info' | 'muted';
}) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <SoftTip label={value}>
      <Badge variant={variant} className="max-w-full font-normal">
        <span>{value}</span>
      </Badge>
    </SoftTip>
  );
}

interface Props {
  pageItems: Practitioner[];
  isLoading: boolean;
  clinicId: string;
  hasActiveFilters?: boolean;
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  emptyAction?: React.ReactNode;
}

export function PractitionersList({
  pageItems,
  isLoading,
  clinicId,
  hasActiveFilters = false,
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
  emptyAction,
}: Props) {
  const router = useRouter();
  const deactivate = useDeactivatePractitioner(clinicId);
  const reactivate = useReactivatePractitioner(clinicId);
  const remove = useDeletePractitioner(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const { t, lang } = useLanguage();
  
  const toggling = deactivate.isPending || reactivate.isPending;
  const toggle = (p: Practitioner, on: boolean) =>
    on ? reactivate.mutate(p.id) : deactivate.mutate(p.id);

  const openProfile = (id: string) => router.push(ROUTES.PRACTITIONER_DETAIL(id));

  const rowMenu = (p: Practitioner) => (
    <RowActionsMenu
      items={[
        {
          label: t.practitioner.view,
          icon: IconView,
          href: ROUTES.PRACTITIONER_DETAIL(p.id),
        },
        {
          label: t.practitioner.edit,
          icon: IconEdit,
          href: ROUTES.PRACTITIONERS_EDIT(p.id),
        },
        {
          label: p.isActive ? t.practitioner.deactivate : t.practitioner.reactivate,
          icon: p.isActive ? IconDeactivate : IconActivate,
          onSelect: () => toggle(p, !p.isActive),
          disabled: toggling,
        },
        {
          label: t.practitioner.delete,
          icon: IconDelete,
          variant: 'destructive',
          onSelect: () => del.ask({ id: p.id, name: getStaffName(p, lang) }),
        },
      ]}
    />
  );

  if (isLoading) {
    return <TableSkeleton rows={8} cols={7} hasHeader={false} />;
  }

  if (totalItems === 0) {
    return (
      <TableFrame>
        <EmptyState
          icon={IconPractitioner}
          title={hasActiveFilters ? t.practitioner.noMatches : t.practitioner.noPractitioners}
          description={
            hasActiveFilters
              ? t.practitioner.noMatchesDesc
              : t.practitioner.noPractitionersDesc
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
                <TableHead className="w-[28%]">{t.practitioner.practitioner}</TableHead>
                <TableHead className="w-[16%]">{t.practitioner.phone}</TableHead>
                <TableHead className="w-[18%]">{t.practitioner.specialty}</TableHead>
                <TableHead className="hidden lg:table-cell w-[16%]">{t.practitioner.department}</TableHead>
                <TableHead className="w-[8%]">{t.practitioner.services}</TableHead>
                <TableHead className="w-[8%]">{t.practitioner.active}</TableHead>
                <TableHead className="w-[6%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((p) => (
                <TableRow
                  key={p.id}
                  className={`cursor-pointer ${!p.isActive ? 'opacity-60' : ''}`}
                  onClick={(e) => {
                    if (isRowControlClick(e)) return;
                    openProfile(p.id);
                  }}
                >
                  <TableCell className="max-w-0 overflow-hidden">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <PreviewableAvatar
                        src={p.imageUrl}
                        seed={p.id}
                        size="sm"
                      />
                      <div
                        className="flex min-w-0 flex-1 flex-col"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TruncatedText className="font-medium">
                          {getStaffName(p, lang)}
                        </TruncatedText>
                        <EmailLink
                          value={p.email}
                          className="min-w-0 w-full text-xs text-muted-foreground"
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className="max-w-0 overflow-hidden text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PhoneLink value={p.phone} className="block" />
                  </TableCell>
                  <TableCell className="max-w-0 overflow-hidden">
                    <CellBadge value={lang === 'ar' && p.specialtyAr ? p.specialtyAr : p.specialty} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-0 overflow-hidden">
                    <CellBadge value={getBilingualName(p.departmentName, p.departmentNameAr, lang)} variant="outline" />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.serviceIds.length}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={p.isActive}
                      disabled={toggling}
                      onCheckedChange={(on) => toggle(p, on)}
                    />
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {rowMenu(p)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableFrame>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:hidden">
        {pageItems.map((p) => (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              if (isRowControlClick(e)) return;
              openProfile(p.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openProfile(p.id);
              }
            }}
            className={`cursor-pointer rounded-xl bg-card p-3 ring-1 ring-foreground/10 ${
              !p.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <PreviewableAvatar src={p.imageUrl} seed={p.id} />
              <div className="min-w-0 flex-1">
                <TruncatedText className="font-medium">{getStaffName(p, lang)}</TruncatedText>
                <div className="mt-0.5 min-w-0" onClick={(e) => e.stopPropagation()}>
                  <EmailLink
                    value={p.email}
                    className="min-w-0 w-full text-xs text-muted-foreground"
                  />
                </div>
                {p.specialty ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    <CellBadge value={lang === 'ar' && p.specialtyAr ? p.specialtyAr : p.specialty} />
                  </div>
                ) : null}
                {p.phone ? (
                  <div
                    className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconPhone className="size-3 shrink-0" />
                    <PhoneLink value={p.phone} className="min-w-0" />
                  </div>
                ) : null}
              </div>
              <div
                className="flex shrink-0 items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Switch
                  checked={p.isActive}
                  disabled={toggling}
                  onCheckedChange={(on) => toggle(p, on)}
                />
                {rowMenu(p)}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-2.5 text-xs">
              <MetaStat
                label={t.practitioner.department}
                value={getBilingualName(p.departmentName, p.departmentNameAr, lang) || '—'}
              />
              <MetaStat label={t.practitioner.services} value={String(p.serviceIds.length)} />
            </div>
          </div>
        ))}
      </div>

      <Pagination
        page={page}
        pageCount={pageCount}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />

      <TwoStepDeleteDialogs
        step1={del.step1}
        step2={del.step2}
        onStep1OpenChange={(open) => !open && del.cancelStep1()}
        onStep2OpenChange={(open) => !open && del.cancelStep2()}
        onContinue={del.advance}
        onConfirm={() => {
          if (!del.step2) return;
          remove.mutate(del.step2.id, { onSuccess: del.clear });
        }}
        isPending={remove.isPending}
        warning={t.practitioner.deleteWarning1}
        finalWarning={t.practitioner.deleteWarning2}
        confirmLabel={t.practitioner.deleteConfirm}
      />
    </>
  );
}
