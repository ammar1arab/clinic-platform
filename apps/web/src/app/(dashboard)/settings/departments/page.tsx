'use client';

import { useState } from 'react';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/primitives';
import { ResourceTable } from '@/components/primitives';
import {
  } from '@/components/ui';
import {
  DirectoryActions,
  RowActionsMenu,
  TruncatedText,
  SearchInput,
  BilingualNameFields,
  optionalArabicName,
  EntityMobileCard,
} from '@/components/primitives';

import {
  IconDelete,
  IconDepartment,
  IconEdit,
} from '@/constants/icons';
import { SettingsAddButton, SettingsFormDialog, SettingsPageBack } from '@/components/blocks/settings/settings-navigation';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeactivateDepartment,
  useReactivateDepartment,
  useDeleteDepartment,
} from '@/hooks/api/use-departments';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useLanguage } from '@/providers';
import { useListFilter } from '@/hooks/shared/use-list-filter';
import { useCreateDialog } from '@/hooks/shared/use-create-dialog';
import type { Department } from '@/services/departments.service';

const searchFields = (d: Department) => [d.name];

export default function DepartmentsPage() {
  const clinicId = useClinicId();
  const { t, lang } = useLanguage();
  const { data: departments, isLoading } = useDepartments(clinicId);
  const {
    search,
    setSearch,
    pageItems,
    pagination,
  } = useListFilter(departments, searchFields);
  const createMutation = useCreateDepartment(clinicId);
  const updateMutation = useUpdateDepartment(clinicId);
  const deactivateMutation = useDeactivateDepartment(clinicId);
  const reactivateMutation = useReactivateDepartment(clinicId);
  const deleteMutation = useDeleteDepartment(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const [open, setOpen] = useCreateDialog();
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isToggling = deactivateMutation.isPending || reactivateMutation.isPending;

  const openCreate = () => {
    setEditing(null);
    setName('');
    setNameAr('');
    setOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setName(dept.name);
    setNameAr(dept.nameAr ?? '');
    setOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: name.trim(),
      nameAr: optionalArabicName(nameAr),
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

  const handleToggleActive = (dept: Department, nextActive: boolean) => {
    if (nextActive) reactivateMutation.mutate(dept.id);
    else deactivateMutation.mutate(dept.id);
  };

  const rowActions = (dept: Department) => (
    <RowActionsMenu
      items={[
        { label: t.common.edit, icon: IconEdit, onSelect: () => openEdit(dept) },
        {
          label: t.common.delete,
          icon: IconDelete,
          variant: 'destructive',
          onSelect: () => del.ask({ id: dept.id, name: dept.name }),
        },
      ]}
    />
  );

  return (
    <div className="w-full min-w-0 space-y-4">
      <SettingsPageBack
        search={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t.settings.searchDepartments}
          />
        }
        actions={<SettingsAddButton label={t.settings.addDepartment} onClick={openCreate} />}
      />

      <ResourceTable
        rows={pageItems}
        rowKey={(dept) => dept.id}
        inactive={(dept) => !dept.isActive}
        isLoading={isLoading}
        pagination={pagination}
        empty={{
          icon: IconDepartment,
          title: search ? t.settings.noMatchingDepartments : t.settings.noDepartments,
          description: search ? t.common.noResults : t.settings.departmentsDesc,
        }}
        columns={[
          {
            id: 'name',
            header: t.common.name,
            className: 'w-[60%]',
            cellClassName: 'max-w-0 overflow-hidden',
            skeleton: 'h-4 w-32 max-w-full',
            render: (dept) => (
              <TruncatedText className="font-medium">
                {lang === 'ar' && dept.nameAr ? dept.nameAr : dept.name}
              </TruncatedText>
            ),
          },
          {
            id: 'active',
            header: t.common.active,
            className: 'w-[40%] text-end',
            skeleton: 'h-5 w-9 ms-auto',
            render: (dept) => (
              <DirectoryActions
                name={dept.name}
                active={dept.isActive}
                disabled={isToggling}
                onChange={(checked) => handleToggleActive(dept, checked)}
              >
                {rowActions(dept)}
              </DirectoryActions>
            ),
          },
        ]}
        mobileCard={(dept) => (
          <EntityMobileCard
            key={dept.id}
            title={lang === 'ar' && dept.nameAr ? dept.nameAr : dept.name}
            active={dept.isActive}
            onActiveChange={(checked: boolean) => handleToggleActive(dept, checked)}
            activeDisabled={isToggling}
            actions={rowActions(dept)}
          />
        )}
      />

      <SettingsFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={!!editing}
        addTitle={t.settings.addDepartment}
        pending={isSaving}
        disabled={!name.trim()}
        onSubmit={handleSubmit}
      >
        <div className="py-2">
          <BilingualNameFields
            name={name}
            nameAr={nameAr}
            onNameChange={setName}
            onNameArChange={setNameAr}
          />
        </div>
      </SettingsFormDialog>

      <TwoStepDeleteDialogs
        controller={del}
        onConfirm={(item) => deleteMutation.mutate(item.id, { onSuccess: del.clear })}
        isPending={deleteMutation.isPending}
        warning="This will permanently remove this department along with its rooms, services, and appointments. This cannot be undone. If you just want to hide it temporarily, use the toggle instead and cancel here."
        finalWarning="This will permanently delete this department and every room, service, and appointment linked to it, including patient visit history. This action cannot be undone."
      />
    </div>
  );
}
