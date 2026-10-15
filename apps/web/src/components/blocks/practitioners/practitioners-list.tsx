"use client";

import {
  TwoStepDeleteDialogs,
  useTwoStepDelete,
  PreviewableAvatar,
  EmailLink,
  PhoneLink,
  TruncatedText,
  Pagination,
  EmptyState,
  DirectoryMeta,
  EntityMobileCard,
  DirectoryTable,
  DirectoryIdentity,
  DirectoryActions,
  SoftTip,
  type DirectoryColumn,
  TableSkeleton,
  RowActionsMenu,
  TableFrame,
} from "@/components/primitives";
import { Badge } from "@/components/ui";
import {
  useDeletePractitioner,
  useDeactivatePractitioner,
  useReactivatePractitioner,
} from "@/hooks/api/use-practitioners";
import { useRouteNav } from "@/hooks/shared/use-route-nav";
import type { Practitioner } from "@/services/practitioners.service";
import {
  IconActivate,
  IconCalendar,
  IconDeactivate,
  IconDelete,
  IconEdit,
  IconPractitioner,
  IconView,
} from "@/constants/icons";
import { useLanguage } from "@/providers";
import { getBilingualName, getStaffName } from "@/i18n";
import { ROUTES } from "@/constants/routes";
import { languageLabels } from "@/constants/practitioner";

function CellBadge({
  value,
  variant = "secondary",
}: {
  value: string | null | undefined;
  variant?: "secondary" | "outline" | "warning" | "info" | "muted";
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
  const { go, prefetch } = useRouteNav();
  const deactivate = useDeactivatePractitioner(clinicId);
  const reactivate = useReactivatePractitioner(clinicId);
  const remove = useDeletePractitioner(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const { t, lang } = useLanguage();

  const toggling = deactivate.isPending || reactivate.isPending;
  const toggle = (p: Practitioner, on: boolean) =>
    on ? reactivate.mutate(p.id) : deactivate.mutate(p.id);

  const openProfile = (id: string) => go(ROUTES.PRACTITIONER_DETAIL(id));
  const prefetchProfile = (id: string) =>
    prefetch(ROUTES.PRACTITIONER_DETAIL(id));

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
          label: t.practitioner.workingHours,
          icon: IconCalendar,
          href: ROUTES.PRACTITIONER_HOURS(p.id),
        },
        {
          label: p.isActive
            ? t.practitioner.deactivate
            : t.practitioner.reactivate,
          icon: p.isActive ? IconDeactivate : IconActivate,
          onSelect: () => toggle(p, !p.isActive),
          disabled: toggling,
        },
        {
          label: t.practitioner.delete,
          icon: IconDelete,
          variant: "destructive",
          onSelect: () => del.ask({ id: p.id, name: getStaffName(p, lang) }),
        },
      ]}
    />
  );

  const nameFor = (p: Practitioner) => getStaffName(p, lang);
  const specialtyFor = (p: Practitioner) =>
    getBilingualName(p.specialty, p.specialtyAr, lang);
  const departmentFor = (p: Practitioner) =>
    getBilingualName(p.departmentName, p.departmentNameAr, lang);
  const roomFor = (p: Practitioner) =>
    getBilingualName(p.defaultRoomName, p.defaultRoomNameAr, lang);
  const experienceFor = (p: Practitioner) =>
    p.experienceYears == null ? "-" : `${p.experienceYears} ${t.common.years}`;
  const controls = (p: Practitioner) => (
    <DirectoryActions
      name={nameFor(p)}
      active={p.isActive}
      disabled={toggling}
      onChange={(on) => toggle(p, on)}
    >
      {rowMenu(p)}
    </DirectoryActions>
  );
  const columns: DirectoryColumn<Practitioner>[] = [
    {
      id: "practitioner",
      label: t.practitioner.practitioner,
      className: "w-[22%]",
      render: (p) => (
        <DirectoryIdentity
          name={nameFor(p)}
          email={p.email}
          avatar={{ src: p.imageUrl, seed: p.id }}
        />
      ),
    },
    {
      id: "specialty",
      label: t.practitioner.specialty,
      className: "w-[13%]",
      render: (p) => (
        <TruncatedText lines={2}>{specialtyFor(p) || "-"}</TruncatedText>
      ),
    },
    {
      id: "department",
      label: t.practitioner.department,
      className: "w-[10%]",
      render: (p) => <CellBadge value={departmentFor(p)} variant="outline" />,
    },
    {
      id: "phone",
      label: t.practitioner.phone,
      className: "w-[12%]",
      cellClassName: "text-muted-foreground",
      render: (p) => <PhoneLink value={p.phone} className="block" />,
    },
    {
      id: "experience",
      label: t.practitioner.experience,
      className: "w-[8%]",
      cellClassName: "text-muted-foreground",
      render: experienceFor,
    },
    {
      id: "languages",
      label: t.practitioner.languages,
      className: "w-[11%]",
      cellClassName: "text-xs text-muted-foreground",
      render: (p) => (
        <TruncatedText lines={2}>
          {languageLabels(p.languages, t) || "-"}
        </TruncatedText>
      ),
    },
    {
      id: "room",
      label: t.entities.room,
      className: "w-[9%]",
      render: (p) => <CellBadge value={roomFor(p)} variant="outline" />,
    },
    {
      id: "services",
      label: t.practitioner.services,
      className: "w-[5%]",
      cellClassName: "tabular-nums",
      render: (p) => p.serviceIds.length,
    },
    {
      id: "actions",
      label: t.practitioner.active,
      className: "w-[10%]",
      render: controls,
    },
  ];

  if (isLoading) {
    return (
      <TableSkeleton
        className="page-fill"
        rows={8}
        cols={10}
        hasHeader={false}
      />
    );
  }

  if (totalItems === 0) {
    return (
      <TableFrame className="page-fill">
        <EmptyState
          icon={IconPractitioner}
          title={
            hasActiveFilters
              ? t.practitioner.noMatches
              : t.practitioner.noPractitioners
          }
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
    <div className="page-fill min-h-0 gap-2">
      <DirectoryTable
        rows={pageItems}
        columns={columns}
        rowKey={(p) => p.id}
        onOpen={(p) => openProfile(p.id)}
        onPrefetch={(p) => prefetchProfile(p.id)}
        inactive={(p) => !p.isActive}
        className="hidden md:flex"
        tableClassName="min-w-[72rem]"
      />
      <div className="page-fill overflow-y-auto overscroll-y-contain md:hidden">
        <div className="grid grid-cols-1 gap-3">
          {pageItems.map((p) => (
            <EntityMobileCard
              key={p.id}
              avatar={<PreviewableAvatar src={p.imageUrl} seed={p.id} />}
              title={nameFor(p)}
              subtitle={<EmailLink value={p.email} />}
              tags={
                specialtyFor(p) ? (
                  <CellBadge value={specialtyFor(p)} />
                ) : undefined
              }
              footer={
                <PhoneLink
                  value={p.phone}
                  className="text-xs text-muted-foreground"
                />
              }
              actions={controls(p)}
              active={p.isActive}
              onClick={() => openProfile(p.id)}
              onMouseEnter={() => prefetchProfile(p.id)}
              onFocus={() => prefetchProfile(p.id)}
              meta={
                <DirectoryMeta
                  columns={columns}
                  item={p}
                  ids={[
                    "department",
                    "experience",
                    "languages",
                    "room",
                    "services",
                  ]}
                />
              }
            />
          ))}
        </div>
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
    </div>
  );
}
