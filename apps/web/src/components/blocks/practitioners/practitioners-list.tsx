'use client';

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import {
  PreviewableAvatar,
  isRowControlClick,
  EmailLink,
  PhoneLink,
  TruncatedText,
  Pagination,
  EmptyState,
  MetaStat,
  TableSkeleton,
  RowActionsMenu,
  SoftTip,
} from '@/components/primitives';
import { TableFrame } from '@/components/blocks/data';
import { PRACTITIONER_EMPLOYMENT_LABEL, PRACTITIONER_EMPLOYMENT_VARIANT, LANGUAGE_BADGE_VARIANT, languageLabelList } from '@/constants/practitioner';
import { ROUTES } from '@/constants/routes';
import { ageLabel } from '@/lib/age';
import {
  TwoStepDeleteDialogs,
  useTwoStepDelete,
} from '@/components/blocks/feedback';
import {
  useDeletePractitioner,
  useDeactivatePractitioner,
  useReactivatePractitioner,
} from '@/hooks/api/use-practitioners';
import type { Practitioner } from '@/services/practitioners.service';
import { IconActivate, IconDeactivate, IconDelete, IconEdit, IconPhone, IconPractitioner, IconView } from '@/constants/icons';

function displayName(p: Practitioner) {
  return p.title ? `${p.title} ${p.name}` : p.name;
}

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

function LanguageBadges({ codes }: { codes: string[] | null | undefined }) {
  const labels = languageLabelList(codes);
  if (!labels.length) return <span className="text-muted-foreground">—</span>;
  const shown = labels.slice(0, 2);
  const rest = labels.slice(2);

  return (
    <div className="flex min-w-0 items-center gap-1">
      {shown.map((label, index) => (
        <Badge
          key={label}
          variant={LANGUAGE_BADGE_VARIANT[index % LANGUAGE_BADGE_VARIANT.length]}
          className="font-normal"
        >
          <span>{label}</span>
        </Badge>
      ))}
      {rest.length > 0 ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`${rest.length} more languages: ${rest.join(', ')}`}
              className="shrink-0 rounded-md px-1 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={(event) => event.stopPropagation()}
            >
              {rest.length} more
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-auto max-w-56 p-2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap gap-1">
              {rest.map((label, index) => (
                <Badge
                  key={label}
                  variant={
                    LANGUAGE_BADGE_VARIANT[
                      (shown.length + index) % LANGUAGE_BADGE_VARIANT.length
                    ]
                  }
                  className="font-normal"
                >
                  <span>{label}</span>
                </Badge>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
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

  const toggling = deactivate.isPending || reactivate.isPending;
  const toggle = (p: Practitioner, on: boolean) =>
    on ? reactivate.mutate(p.id) : deactivate.mutate(p.id);

  const openProfile = (id: string) => router.push(ROUTES.PRACTITIONER_DETAIL(id));

  const rowMenu = (p: Practitioner) => (
    <RowActionsMenu
      items={[
        {
          label: 'View',
          icon: IconView,
          href: ROUTES.PRACTITIONER_DETAIL(p.id),
        },
        {
          label: 'Edit',
          icon: IconEdit,
          href: ROUTES.PRACTITIONERS_EDIT(p.id),
        },
        {
          label: p.isActive ? 'Deactivate' : 'Reactivate',
          icon: p.isActive ? IconDeactivate : IconActivate,
          onSelect: () => toggle(p, !p.isActive),
          disabled: toggling,
        },
        {
          label: 'Delete',
          icon: IconDelete,
          variant: 'destructive',
          onSelect: () => del.ask({ id: p.id, name: displayName(p) }),
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
          title={hasActiveFilters ? 'No matches' : 'No practitioners'}
          description={
            hasActiveFilters
              ? 'Try a different name, email, department, or filter.'
              : 'Create a practitioner with department, services, and availability.'
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
                <TableHead className="w-[22%]">Practitioner</TableHead>
                <TableHead className="w-[12%]">Phone</TableHead>
                <TableHead className="w-[7%]">Age</TableHead>
                <TableHead className="w-[12%]">Specialty</TableHead>
                <TableHead className="hidden lg:table-cell w-[11%]">Department</TableHead>
                <TableHead className="hidden xl:table-cell w-[11%]">Languages</TableHead>
                <TableHead className="w-[7%]">Services</TableHead>
                <TableHead className="hidden lg:table-cell w-[10%]">Employment</TableHead>
                <TableHead className="hidden xl:table-cell w-[6%]">Buffer</TableHead>
                <TableHead className="w-[7%]">Active</TableHead>
                <TableHead className="w-[7%]" />
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
                        alt={displayName(p)}
                        size="sm"
                      />
                      <div
                        className="flex min-w-0 flex-1 flex-col"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TruncatedText className="font-medium">
                          {displayName(p)}
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
                  <TableCell className="text-muted-foreground">
                    {ageLabel(p.dob) || '—'}
                  </TableCell>
                  <TableCell className="max-w-0 overflow-hidden">
                    <CellBadge value={p.specialty} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-0 overflow-hidden">
                    <CellBadge value={p.departmentName} variant="outline" />
                  </TableCell>
                  <TableCell
                    className="hidden xl:table-cell max-w-0 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LanguageBadges codes={p.languages} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.serviceIds.length}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-0 overflow-hidden">
                    {p.employmentType ? (
                      <CellBadge
                        value={
                          PRACTITIONER_EMPLOYMENT_LABEL[p.employmentType] ??
                          p.employmentType
                        }
                        variant={
                          PRACTITIONER_EMPLOYMENT_VARIANT[p.employmentType] ??
                          'secondary'
                        }
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">
                    {p.bufferMins}m
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
              <PreviewableAvatar src={p.imageUrl} seed={p.id} alt={displayName(p)} />
              <div className="min-w-0 flex-1">
                <TruncatedText className="font-medium">{displayName(p)}</TruncatedText>
                <div className="mt-0.5 min-w-0" onClick={(e) => e.stopPropagation()}>
                  <EmailLink
                    value={p.email}
                    className="min-w-0 w-full text-xs text-muted-foreground"
                  />
                </div>
                {p.specialty || p.employmentType ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.specialty ? <CellBadge value={p.specialty} /> : null}
                    {p.employmentType ? (
                      <CellBadge
                        value={
                          PRACTITIONER_EMPLOYMENT_LABEL[p.employmentType] ?? p.employmentType
                        }
                        variant={
                          PRACTITIONER_EMPLOYMENT_VARIANT[p.employmentType] ?? 'secondary'
                        }
                      />
                    ) : null}
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
              <MetaStat label="Department" value={p.departmentName ?? '—'} />
              <div className="min-w-0">
                <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                  Languages
                </p>
                <LanguageBadges codes={p.languages} />
              </div>
              <MetaStat label="Services" value={String(p.serviceIds.length)} />
              <MetaStat label="Age" value={ageLabel(p.dob) || '—'} />
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
        warning="This permanently removes the practitioner, their schedule, and their appointments. This cannot be undone. To just hide them, use Deactivate instead."
        finalWarning="This permanently deletes the practitioner and every appointment assigned to them. This action cannot be undone."
        confirmLabel="Yes, delete practitioner"
      />
    </>
  );
}
