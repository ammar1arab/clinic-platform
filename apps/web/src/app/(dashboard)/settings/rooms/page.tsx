'use client';

import { useState } from 'react';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/primitives';
import { ResourceTable } from '@/components/primitives';
import {
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
  IconRoom,
} from '@/constants/icons';
import { FORM_NONE } from '@/constants/form';
import { SettingsAddButton, SettingsFormDialog, SettingsPageBack } from '@/components/blocks/settings/settings-navigation';
import {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeactivateRoom,
  useReactivateRoom,
  useDeleteRoom,
} from '@/hooks/api/use-rooms';
import { useDepartments } from '@/hooks/api/use-departments';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useListFilter } from '@/hooks/shared/use-list-filter';
import { useCreateDialog } from '@/hooks/shared/use-create-dialog';
import { useLanguage } from '@/providers';
import type { Room } from '@/services/rooms.service';

const searchFields = (r: Room) => [r.name];

export default function RoomsPage() {
  const clinicId = useClinicId();
  const { t, lang } = useLanguage();
  const { data: rooms, isLoading } = useRooms(clinicId);
  const { data: departments } = useDepartments(clinicId);
  const {
    search,
    setSearch,
    pageItems,
    pagination,
  } = useListFilter(rooms, searchFields);
  const createMutation = useCreateRoom(clinicId);
  const updateMutation = useUpdateRoom(clinicId);
  const deactivateMutation = useDeactivateRoom(clinicId);
  const reactivateMutation = useReactivateRoom(clinicId);
  const deleteMutation = useDeleteRoom(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const [open, setOpen] = useCreateDialog();
  const [editing, setEditing] = useState<Room | null>(null);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [departmentId, setDepartmentId] = useState('');

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
    setOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditing(room);
    setName(room.name);
    setNameAr(room.nameAr ?? '');
    setDepartmentId(room.departmentId ?? '');
    setOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: name.trim(),
      nameAr: optionalArabicName(nameAr),
      departmentId: departmentId || undefined,
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

  const handleToggleActive = (room: Room, nextActive: boolean) => {
    if (nextActive) reactivateMutation.mutate(room.id);
    else deactivateMutation.mutate(room.id);
  };

  const rowActions = (room: Room) => (
    <RowActionsMenu
      items={[
        { label: t.common.edit, icon: IconEdit, onSelect: () => openEdit(room) },
        {
          label: t.common.delete,
          icon: IconDelete,
          variant: 'destructive',
          onSelect: () => del.ask({ id: room.id, name: room.name }),
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
            placeholder={t.settings.searchRooms}
          />
        }
        actions={<SettingsAddButton label={t.settings.addRoom} onClick={openCreate} />}
      />

      <ResourceTable
        rows={pageItems}
        rowKey={(room) => room.id}
        inactive={(room) => !room.isActive}
        isLoading={isLoading}
        pagination={pagination}
        empty={{
          icon: IconRoom,
          title: search ? t.settings.noMatchingRooms : t.settings.noRooms,
          description: search ? t.common.noResults : t.settings.roomsDesc,
        }}
        columns={[
          {
            id: 'name',
            header: t.common.name,
            className: 'w-[45%]',
            cellClassName: 'max-w-0 overflow-hidden',
            skeleton: 'h-4 w-32 max-w-full',
            render: (room) => (
              <TruncatedText className="font-medium">
                {lang === 'ar' && room.nameAr ? room.nameAr : room.name}
              </TruncatedText>
            ),
          },
          {
            id: 'department',
            header: t.settings.departments,
            className: 'w-[25%]',
            cellClassName: 'max-w-0 overflow-hidden',
            skeleton: 'h-4 w-24',
            render: (room) => (
              <TruncatedText className="text-muted-foreground">
                {departmentName(room.departmentId)}
              </TruncatedText>
            ),
          },
          {
            id: 'active',
            header: t.common.active,
            className: 'w-[30%] text-end',
            skeleton: 'h-5 w-9 ms-auto',
            render: (room) => (
              <DirectoryActions
                name={room.name}
                active={room.isActive}
                disabled={isToggling}
                onChange={(checked) => handleToggleActive(room, checked)}
              >
                {rowActions(room)}
              </DirectoryActions>
            ),
          },
        ]}
        mobileCard={(room) => (
          <EntityMobileCard
            key={room.id}
            title={lang === 'ar' && room.nameAr ? room.nameAr : room.name}
            active={room.isActive}
            onActiveChange={(checked) => handleToggleActive(room, checked)}
            activeDisabled={isToggling}
            actions={rowActions(room)}
            meta={
              <>
                <EntityMetaStat label={t.settings.departments} value={departmentName(room.departmentId)} />
                <EntityMetaStat
                  label={t.common.status}
                  value={room.isActive ? t.common.active : t.common.inactive}
                />
              </>
            }
          />
        )}
      />

      <SettingsFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={!!editing}
        addTitle={t.settings.addRoom}
        pending={isSaving}
        disabled={!name.trim()}
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
        </div>
      </SettingsFormDialog>

      <TwoStepDeleteDialogs
        controller={del}
        onConfirm={(item) => deleteMutation.mutate(item.id, { onSuccess: del.clear })}
        isPending={deleteMutation.isPending}
        warning="This will permanently remove this room and any appointments booked in it. This cannot be undone. If you just want to hide it temporarily, use the toggle instead and cancel here."
        finalWarning="This will permanently delete this room and every appointment linked to it, including patient visit history. This action cannot be undone."
      />
    </div>
  );
}
