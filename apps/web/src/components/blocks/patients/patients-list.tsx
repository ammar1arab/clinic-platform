"use client";

import { DEFAULT_PAGE_SIZE } from "@/components/primitives/display/pagination";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui";
import {
  TableFrame,
  useTwoStepDelete,
  TwoStepDeleteDialogs,
  PreviewableAvatar,
  PhoneLink,
  EmailLink,
  TruncatedText,
  Pagination,
  EmptyState,
  DirectoryMeta,
  EntityMobileCard,
  DirectoryTable,
  DirectoryIdentity,
  DirectoryActions,
  type DirectoryColumn,
  DirectoryViewSkeleton,
  RowActionsMenu,
  SoftTip,
} from "@/components/primitives";
import {
  useTogglePatientStatus,
  useDeletePatient,
} from "@/hooks/api/use-patients";
import { useRouteNav } from "@/hooks/shared/use-route-nav";
import type { Patient } from "@/services/patients.service";
import { genderLabel, patientAgeLabel } from "@/constants/patient";
import {
  IconActivate,
  IconDeactivate,
  IconDelete,
  IconEdit,
  IconLoyal,
  IconPatients,
  IconView,
} from "@/constants/icons";
import { useLanguage } from "@/providers";
import { getPersonName } from "@/i18n";
import { formatDateTime } from "@/lib/datetime";
import { ROUTES } from "@/constants/routes";

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

interface Props {
  patients: Patient[] | undefined;
  isLoading: boolean;
  hasActiveFilters?: boolean;
  emptyAction?: React.ReactNode;
  canManage?: boolean;
}

export function PatientsList({
  patients,
  isLoading,
  hasActiveFilters = false,
  emptyAction,
  canManage = true,
}: Props) {
  const { t, lang } = useLanguage();
  const { go, prefetch } = useRouteNav();
  const toggleStatus = useTogglePatientStatus();
  const deleteMutation = useDeletePatient();
  const del = useTwoStepDelete<{ id: string; name: string }>();
  const [page, setPage] = useState(1);

  const totalItems = patients?.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  const [prevPatients, setPrevPatients] = useState(patients);
  if (patients !== prevPatients) {
    setPrevPatients(patients);
    setPage(1);
  }

  const pageItems = useMemo(() => {
    if (!patients) return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return patients.slice(start, start + PAGE_SIZE);
  }, [patients, currentPage]);

  const openPatient = (id: string) => go(ROUTES.PATIENT_DETAIL(id));
  const prefetchPatient = (id: string) => prefetch(ROUTES.PATIENT_DETAIL(id));

  const rowMenu = (p: Patient, fullName: string) => (
    <RowActionsMenu
      items={[
        {
          label: t.common.view,
          icon: IconView,
          href: ROUTES.PATIENT_DETAIL(p.id),
        },
        ...(canManage
          ? [
              {
                label: t.common.edit,
                icon: IconEdit,
                href: ROUTES.PATIENT_EDIT(p.id),
              },
              {
                label: p.isActive ? t.common.deactivate : t.common.reactivate,
                icon: p.isActive ? IconDeactivate : IconActivate,
                disabled: toggleStatus.isPending,
                onSelect: () =>
                  toggleStatus.mutate({ id: p.id, isActive: !p.isActive }),
              },
              {
                label: t.common.delete,
                icon: IconDelete,
                variant: "destructive" as const,
                onSelect: () => del.ask({ id: p.id, name: fullName }),
              },
            ]
          : []),
      ]}
    />
  );

  const nameFor = (patient: Patient) => getPersonName(patient, lang);
  const loyalty = (patient: Patient) =>
    patient.isLoyal ? (
      <SoftTip label={t.patient.loyalPatient}>
        <IconLoyal className="size-3.5 shrink-0 fill-warning text-warning" />
      </SoftTip>
    ) : null;
  const gender = (patient: Patient) => {
    const label = genderLabel(patient.gender, t);
    return label ? (
      <Badge
        variant={patient.gender === "female" ? "warning" : "info"}
        className="font-normal"
      >
        {label}
      </Badge>
    ) : (
      "-"
    );
  };
  const controls = (patient: Patient) => {
    if (!canManage) return null;
    return (
    <DirectoryActions
      className="justify-between"
      name={nameFor(patient)}
      active={patient.isActive}
      disabled={toggleStatus.isPending}
      onChange={(isActive) => toggleStatus.mutate({ id: patient.id, isActive })}
    >
      {rowMenu(patient, nameFor(patient))}
    </DirectoryActions>
    );
  };
  const columns: DirectoryColumn<Patient>[] = [
    {
      id: "patient",
      label: t.patient.patient,
      className: "w-[20%]",
      render: (p) => (
        <DirectoryIdentity
          copyContacts
          name={nameFor(p)}
          email={p.email}
          avatar={{ src: p.imageUrl, seed: p.id }}
          badge={loyalty(p)}
        />
      ),
    },
    {
      id: "phone",
      label: t.patient.phone,
      className: "w-[12%]",
      cellClassName: "text-muted-foreground",
      render: (p) => <PhoneLink copyable value={p.phone} className="block" />,
    },
    {
      id: "doctor",
      label: t.patient.practitioner,
      className: "w-[13%]",
      render: (p) => (
        <TruncatedText>{p.primaryDoctorName ?? "-"}</TruncatedText>
      ),
    },
    {
      id: "lastVisit",
      label: t.patient.lastVisit,
      className: "w-[14%]",
      cellClassName: "text-xs text-muted-foreground",
      render: (p) => formatDateTime(p.lastVisit, undefined, lang),
    },
    {
      id: "sessions",
      label: t.patient.sessions,
      className: "w-[8%]",
      cellClassName: "tabular-nums",
      render: (p) => p.totalSessions,
    },
    {
      id: "age",
      label: t.patient.age,
      className: "w-[8%]",
      render: (p) => patientAgeLabel(p.dob, t) || "-",
    },
    {
      id: "gender",
      label: t.patient.gender,
      className: "w-[8%]",
      render: gender,
    },
    {
      id: "nationalId",
      label: t.patient.nationalId,
      className: "w-[9%]",
      cellClassName: "text-muted-foreground tabular-nums",
      render: (p) => <TruncatedText>{p.nationalId ?? "-"}</TruncatedText>,
    },
    ...(canManage
      ? [{
          id: "actions",
          label: t.common.active,
          className: "w-[8%]",
          render: controls,
        }]
      : []),
  ];

  if (isLoading) {
    return (
      <DirectoryViewSkeleton variant="patient" canManage={canManage} />
    );
  }

  if (!patients || patients.length === 0) {
    return (
      <TableFrame className="page-fill">
        <EmptyState
          icon={IconPatients}
          title={hasActiveFilters ? t.patient.noMatches : t.patient.noPatients}
          description={
            hasActiveFilters
              ? t.patient.noMatchesDesc
              : t.patient.noPatientsDesc
          }
          action={canManage && !hasActiveFilters ? emptyAction : undefined}
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
        onOpen={(p) => openPatient(p.id)}
        onPrefetch={(p) => prefetchPatient(p.id)}
        inactive={(p) => !p.isActive}
        className="hidden lg:flex"
        tableClassName="min-w-[64rem]"
      />
      <div className="page-fill overflow-y-auto overscroll-y-contain lg:hidden">
        <div className="grid grid-cols-1 gap-3">
          {pageItems.map((p) => (
            <EntityMobileCard
              key={p.id}
              avatar={<PreviewableAvatar src={p.imageUrl} seed={p.id} />}
              title={
                <div className="flex min-w-0 items-center gap-1.5">
                  <TruncatedText>{nameFor(p)}</TruncatedText>
                  {loyalty(p)}
                </div>
              }
              subtitle={p.email ? <EmailLink copyable value={p.email} /> : undefined}
              tags={gender(p)}
              footer={
                <div dir="ltr" className="flex w-full min-w-0 items-center justify-between gap-3 text-xs text-muted-foreground">
                  <bdi dir="auto" className="shrink-0">{patientAgeLabel(p.dob, t)}</bdi>
                  <PhoneLink
                  copyable
                  value={p.phone}
                  className="min-w-0 text-xs text-muted-foreground"
                />
                </div>
              }
              actions={canManage ? controls(p) : undefined}
              active={p.isActive}
              onClick={() => openPatient(p.id)}
              onMouseEnter={() => prefetchPatient(p.id)}
              onFocus={() => prefetchPatient(p.id)}
              meta={
                <DirectoryMeta
                  columns={columns}
                  item={p}
                  ids={["doctor", "lastVisit", "sessions", "nationalId"]}
                />
              }
            />
          ))}
        </div>
      </div>

      <Pagination
        page={currentPage}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {canManage && <TwoStepDeleteDialogs
        controller={del}
        onConfirm={(item) => deleteMutation.mutate(item.id, { onSuccess: del.clear })}
        isPending={deleteMutation.isPending}
        warning={t.patient.deleteWarning1}
        finalWarning={t.patient.deleteWarning2}
        confirmLabel={t.patient.deleteConfirm}
      />}
    </div>
  );
}
