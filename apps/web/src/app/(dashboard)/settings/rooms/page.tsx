'use client';

import { useState } from 'react';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/primitives';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
  Switch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  } from '@/components/ui';
import {
  RowActionsMenu,
  EmptyState,
  FormField,
  FormActions,
  TruncatedText,
  SearchInput,
  Pagination,
  BilingualNameFields,
  optionalArabicName,
  PageBack,
  TableFrame,
  EntityMetaStat,
  EntityMobileCard,
} from '@/components/primitives';

import {
  IconAdd,
  IconDelete,
  IconEdit,
  IconRoom,
} from '@/constants/icons';
import { FORM_NONE } from '@/constants/form';
import { ROUTES } from '@/constants/routes';
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
    page,
    setPage,
    pageCount,
    pageItems,
    totalItems,
    pageSize,
  } = useListFilter(rooms, searchFields);
  const createMutation = useCreateRoom(clinicId);
  const updateMutation = useUpdateRoom(clinicId);
  const deactivateMutation = useDeactivateRoom(clinicId);
  const reactivateMutation = useReactivateRoom(clinicId);
  const deleteMutation = useDeleteRoom(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const [open, setOpen] = useState(false);
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
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4">
      <PageBack backHref={ROUTES.SETTINGS} backLabel={t.settings.title} />

      <div className="flex items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t.settings.searchRooms}
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <IconAdd className="size-4 me-1.5" />
          <span className="hidden sm:inline">{t.settings.addRoom}</span>
          <span className="sm:hidden">{t.common.add}</span>
        </Button>
      </div>

      <div className="hidden md:block">
        <TableFrame>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%]">{t.common.name}</TableHead>
                <TableHead className="w-[25%]">{t.settings.departments}</TableHead>
                <TableHead className="w-[15%]">{t.common.active}</TableHead>
                <TableHead className="w-[15%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32 max-w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-9" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}

              {!isLoading && totalItems === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState
                      icon={IconRoom}
                      title={search ? t.settings.noMatchingRooms : t.settings.noRooms}
                      description={
                        search
                          ? t.common.noResults
                          : t.settings.roomsDesc
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {pageItems.map((room) => (
                <TableRow key={room.id} className={!room.isActive ? 'opacity-60' : undefined}>
                  <TableCell className="max-w-0 overflow-hidden">
                    <TruncatedText className="font-medium">
                      {lang === 'ar' && room.nameAr ? room.nameAr : room.name}
                    </TruncatedText>
                  </TableCell>
                  <TableCell className="max-w-0 overflow-hidden">
                    <TruncatedText className="text-muted-foreground">
                      {departmentName(room.departmentId)}
                    </TruncatedText>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={room.isActive}
                      onCheckedChange={(checked) => handleToggleActive(room, checked)}
                      disabled={isToggling}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">{rowActions(room)}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableFrame>
      </div>

      <div className="space-y-2 md:hidden">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/70 bg-card p-4">
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        {!isLoading && totalItems === 0 && (
          <EmptyState
            icon={IconRoom}
            title={search ? t.settings.noMatchingRooms : t.settings.noRooms}
            description={
              search
                ? t.common.noResults
                : t.settings.roomsDesc
            }
          />
        )}
        {pageItems.map((room) => (
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
        ))}
      </div>

      <Pagination
        page={page}
        pageCount={pageCount}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? t.common.edit : t.settings.addRoom}
            </DialogTitle>
          </DialogHeader>
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
          <DialogFooter>
            <FormActions
              variant="dialog"
              onCancel={() => setOpen(false)}
              submitLabel={editing ? t.common.save : t.common.create}
              pending={isSaving}
              disabled={!name.trim()}
              onSubmitClick={handleSubmit}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TwoStepDeleteDialogs
        step1={del.step1}
        step2={del.step2}
        onStep1OpenChange={(open) => !open && del.cancelStep1()}
        onStep2OpenChange={(open) => !open && del.cancelStep2()}
        onContinue={del.advance}
        onConfirm={() => {
          if (!del.step2) return;
          deleteMutation.mutate(del.step2.id, { onSuccess: del.clear });
        }}
        isPending={deleteMutation.isPending}
        warning="This will permanently remove this room and any appointments booked in it. This cannot be undone. If you just want to hide it temporarily, use the toggle instead and cancel here."
        finalWarning="This will permanently delete this room and every appointment linked to it, including patient visit history. This action cannot be undone."
      />
    </div>
  );
}
