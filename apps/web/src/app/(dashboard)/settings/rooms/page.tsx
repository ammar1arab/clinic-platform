'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ButtonSpinner, TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/blocks/feedback';
import { EmptyState } from '@/components/primitives/empty-state';
import { TruncatedText } from '@/components/primitives/truncated-text';
import { SearchInput } from '@/components/primitives/search-input';
import { Pagination } from '@/components/primitives/pagination';
import { TableFrame } from '@/components/blocks/data/table-frame';
import {
  EntityMetaStat,
  EntityMobileCard,
} from '@/components/blocks/data/entity-mobile-card';
import {
  IconAdd,
  IconDelete,
  IconEdit,
  IconRoom,
} from '@/constants/icons';
import {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeactivateRoom,
  useReactivateRoom,
  useDeleteRoom,
} from '@/hooks/use-rooms';
import { useDepartments } from '@/hooks/use-departments';
import { useClinicId } from '@/hooks/use-clinic-id';
import { useListFilter } from '@/hooks/use-list-filter';
import { Room } from '@/services/rooms.service';
import {
  BilingualNameFields,
  optionalArabicName,
} from '@/components/primitives/bilingual-name-fields';

const searchFields = (r: Room) => [r.name];

export default function RoomsPage() {
  const clinicId = useClinicId();
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

  const departmentName = (id: string | null) =>
    departments?.find((d) => d.id === id)?.name ?? '—';

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
    <>
      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(room)}>
        <IconEdit className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-destructive hover:text-destructive"
        onClick={() => del.ask({ id: room.id, name: room.name })}
      >
        <IconDelete className="size-3.5" />
      </Button>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search rooms…"
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <IconAdd className="size-4 mr-1.5" />
          <span className="hidden sm:inline">Add Room</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="hidden md:block">
        <TableFrame>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%]">Name</TableHead>
                <TableHead className="w-[25%]">Department</TableHead>
                <TableHead className="w-[15%]">Active</TableHead>
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
                      title={search ? 'No matching rooms' : 'No rooms yet'}
                      description={
                        search
                          ? 'Try a different search term.'
                          : 'Add a room to assign appointments and procedures.'
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {pageItems.map((room) => (
                <TableRow key={room.id} className={!room.isActive ? 'opacity-60' : undefined}>
                  <TableCell className="max-w-0 overflow-hidden">
                    <TruncatedText className="font-medium">{room.name}</TruncatedText>
                  </TableCell>
                  <TableCell className="max-w-0 overflow-hidden text-muted-foreground">
                    <TruncatedText>{departmentName(room.departmentId)}</TruncatedText>
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

      <div className="grid grid-cols-1 gap-2.5 md:hidden">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] w-full rounded-xl" />
          ))}
        {!isLoading && totalItems === 0 && (
          <EmptyState
            icon={IconRoom}
            title={search ? 'No matching rooms' : 'No rooms yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Add a room to assign appointments and procedures.'
            }
          />
        )}
        {pageItems.map((room) => (
          <EntityMobileCard
            key={room.id}
            title={room.name}
            active={room.isActive}
            onActiveChange={(checked) => handleToggleActive(room, checked)}
            activeDisabled={isToggling}
            actions={rowActions(room)}
            meta={
              <>
                <EntityMetaStat label="Department" value={departmentName(room.departmentId)} />
                <EntityMetaStat
                  label="Status"
                  value={room.isActive ? 'Active' : 'Inactive'}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Room' : 'New Room'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <BilingualNameFields
              name={name}
              nameAr={nameAr}
              onNameChange={setName}
              onNameArChange={setNameAr}
            />
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={departmentId || '__none__'}
                onValueChange={(v) => setDepartmentId(v === '__none__' ? '' : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No department" />
                </SelectTrigger>
                <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="__none__">No department</SelectItem>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="truncate">{d.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || isSaving}>
              {isSaving && <ButtonSpinner />}
              {editing ? 'Save' : 'Create'}
            </Button>
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
