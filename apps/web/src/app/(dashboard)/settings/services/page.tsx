'use client';

import { useState } from 'react';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/primitives';
import { ResourceTable } from '@/components/primitives';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  } from '@/components/ui';
import {
  DirectoryActions,
  RowActionsMenu,
  FormField,
  TruncatedText,
  SearchInput,
  BilingualNameFields,
  optionalArabicName,
  EntityMetaStat,
  EntityMobileCard,
} from '@/components/primitives';

import {
  IconDelete,
  IconEdit,
  IconService,
} from '@/constants/icons';
import { FORM_NONE } from '@/constants/form';
import { SettingsAddButton, SettingsFormDialog, SettingsPageBack } from '@/components/blocks/settings/settings-navigation';
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeactivateService,
  useReactivateService,
  useDeleteService,
} from '@/hooks/api/use-services';
import { useDepartments } from '@/hooks/api/use-departments';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useListFilter } from '@/hooks/shared/use-list-filter';
import { useCreateDialog } from '@/hooks/shared/use-create-dialog';
import { useLanguage } from '@/providers';
import type { ServiceItem } from '@/services/services.service';

const searchFields = (s: ServiceItem) => [s.name];

export default function ServicesPage() {
  const clinicId = useClinicId();
  const { t, lang } = useLanguage();
  const { data: services, isLoading } = useServices(clinicId);
  const { data: departments } = useDepartments(clinicId);
  const {
    search,
    setSearch,
    pageItems,
    pagination,
  } = useListFilter(services, searchFields);
  const createMutation = useCreateService(clinicId);
  const updateMutation = useUpdateService(clinicId);
  const deactivateMutation = useDeactivateService(clinicId);
  const reactivateMutation = useReactivateService(clinicId);
  const deleteMutation = useDeleteService(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const [open, setOpen] = useCreateDialog();
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [durationMins, setDurationMins] = useState('45');
  const [fee, setFee] = useState('');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isToggling = deactivateMutation.isPending || reactivateMutation.isPending;

  const departmentName = (id: string | null) => {
    const dept = departments?.find((d) => d.id === id);
    if (!dept) return '—';
    return lang === 'ar' && dept.nameAr ? dept.nameAr : dept.name;
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setNameAr('');
    setDepartmentId('');
    setDurationMins('45');
    setFee('');
    setOpen(true);
  };

  const openEdit = (svc: ServiceItem) => {
    setEditing(svc);
    setName(svc.name);
    setNameAr(svc.nameAr ?? '');
    setDepartmentId(svc.departmentId ?? '');
    setDurationMins(String(svc.durationMins));
    setFee(svc.fee);
    setOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: name.trim(),
      nameAr: optionalArabicName(nameAr),
      departmentId: departmentId || undefined,
      durationMins: Number(durationMins),
      fee: Number(fee),
    };
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createMutation.mutate(
        { clinicId, ...payload },
        { onSuccess: () => setOpen(false) },
      );
    }
  };

  const handleToggleActive = (svc: ServiceItem, nextActive: boolean) => {
    if (nextActive) reactivateMutation.mutate(svc.id);
    else deactivateMutation.mutate(svc.id);
  };
  const rowActions = (svc: ServiceItem) => (
    <RowActionsMenu
      items={[
        { label: t.common.edit, icon: IconEdit, onSelect: () => openEdit(svc) },
        {
          label: t.common.delete,
          icon: IconDelete,
          variant: 'destructive',
          onSelect: () => del.ask({ id: svc.id, name: svc.name }),
        },
      ]}
    />
  );

  return (
    <div className="page-fill-always min-w-0 gap-4">
      <SettingsPageBack
        search={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t.settings.searchServices}
          />
        }
        actions={<SettingsAddButton label={t.settings.addService} onClick={openCreate} />}
      />

      <ResourceTable
        rows={pageItems}
        rowKey={(svc) => svc.id}
        inactive={(svc) => !svc.isActive}
        isLoading={isLoading}
        pagination={pagination}
        empty={{
          icon: IconService,
          title: search ? t.settings.noMatchingServices : t.settings.noServices,
          description: search ? t.common.noResults : t.settings.servicesDesc,
        }}
        columns={[
          {
            id: 'name',
            header: t.common.name,
            className: 'w-[32%]',
            cellClassName: 'max-w-0 overflow-hidden',
            skeleton: 'h-4 w-32 max-w-full',
            render: (svc) => (
              <TruncatedText className="font-medium">
                {lang === 'ar' && svc.nameAr ? svc.nameAr : svc.name}
              </TruncatedText>
            ),
          },
          {
            id: 'department',
            header: t.settings.departments,
            className: 'w-[22%]',
            cellClassName: 'max-w-0 overflow-hidden text-muted-foreground',
            skeleton: 'h-4 w-24',
            render: (svc) => (
              <TruncatedText>{departmentName(svc.departmentId)}</TruncatedText>
            ),
          },
          {
            id: 'duration',
            header: t.common.duration,
            className: 'w-[12%]',
            cellClassName: 'text-muted-foreground',
            skeleton: 'h-4 w-12',
            render: (svc) => (
              <>{svc.durationMins}{t.common.minsCompact}</>
            ),
          },
          {
            id: 'fee',
            header: <>{t.common.fee} (JOD)</>,
            className: 'w-[14%]',
            cellClassName: 'font-mono text-xs',
            skeleton: 'h-4 w-16',
            render: (svc) => (
              <>{Number(svc.fee).toFixed(3)} JOD</>
            ),
          },
          {
            id: 'active',
            header: t.common.active,
            className: 'w-[20%] text-end',
            skeleton: 'h-5 w-9 ms-auto',
            render: (svc) => (
              <DirectoryActions
                name={svc.name}
                active={svc.isActive}
                disabled={isToggling}
                onChange={(checked) => handleToggleActive(svc, checked)}
              >
                {rowActions(svc)}
              </DirectoryActions>
            ),
          },
        ]}
        mobileCard={(svc) => (
          <EntityMobileCard
            key={svc.id}
            title={lang === 'ar' && svc.nameAr ? svc.nameAr : svc.name}
            active={svc.isActive}
            onActiveChange={(checked) => handleToggleActive(svc, checked)}
            activeDisabled={isToggling}
            actions={rowActions(svc)}
            meta={
              <>
                <EntityMetaStat label={t.settings.departments} value={departmentName(svc.departmentId)} />
                <EntityMetaStat label={t.common.duration} value={`${svc.durationMins}${t.common.minsCompact}`} />
                <EntityMetaStat label={t.common.fee} value={`${Number(svc.fee).toFixed(3)} JOD`} />
              </>
            }
          />
        )}
      />

      <SettingsFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={!!editing}
        addTitle={t.settings.addService}
        pending={isSaving}
        disabled={!name.trim() || !fee}
        onSubmit={handleSubmit}
      >
        <div className="py-2 space-y-3">
          <BilingualNameFields
            name={name}
            nameAr={nameAr}
            onNameChange={setName}
            onNameArChange={setNameAr}
          />
          <FormField label={t.settings.departments}>
            <Select
              value={departmentId || FORM_NONE}
              onValueChange={(v) => setDepartmentId(v === FORM_NONE ? '' : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.common.none} />
              </SelectTrigger>
              <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                <SelectItem value={FORM_NONE}>{t.common.none}</SelectItem>
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="truncate">{lang === 'ar' && d.nameAr ? d.nameAr : d.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={`${t.common.duration} (${t.common.minsCompact})`} htmlFor="duration">
              <Input
                id="duration"
                type="number"
                min={5}
                max={480}
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
              />
            </FormField>
            <FormField label={`${t.common.fee} (JOD)`} htmlFor="fee">
              <Input
                id="fee"
                type="number"
                step="0.001"
                min={0}
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </SettingsFormDialog>

      <TwoStepDeleteDialogs
        controller={del}
        onConfirm={(item) => deleteMutation.mutate(item.id, { onSuccess: del.clear })}
        isPending={deleteMutation.isPending}
        warning="This will permanently remove this service and any appointments that use it. This cannot be undone. If you just want to hide it temporarily, use the toggle instead and cancel here."
        finalWarning="This will permanently delete this service and every appointment linked to it, including patient visit history. This action cannot be undone."
      />
    </div>
  );
}
