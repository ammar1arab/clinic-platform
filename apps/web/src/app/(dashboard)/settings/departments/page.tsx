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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  IconDepartment,
  IconEdit,
} from '@/constants/icons';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeactivateDepartment,
  useReactivateDepartment,
  useDeleteDepartment,
} from '@/hooks/use-departments';
import { useClinicId } from '@/hooks/use-clinic-id';
import { useListFilter } from '@/hooks/use-list-filter';
import { Department } from '@/services/departments.service';

const searchFields = (d: Department) => [d.name];

export default function DepartmentsPage() {
  const clinicId = useClinicId();
  const { data: departments, isLoading } = useDepartments(clinicId);
  const {
    search,
    setSearch,
    page,
    setPage,
    pageCount,
    pageItems,
    totalItems,
    pageSize,
  } = useListFilter(departments, searchFields);
  const createMutation = useCreateDepartment(clinicId);
  const updateMutation = useUpdateDepartment(clinicId);
  const deactivateMutation = useDeactivateDepartment(clinicId);
  const reactivateMutation = useReactivateDepartment(clinicId);
  const deleteMutation = useDeleteDepartment(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState('');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isToggling = deactivateMutation.isPending || reactivateMutation.isPending;

  const openCreate = () => {
    setEditing(null);
    setName('');
    setOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setName(dept.name);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: { name, nameAr: editing.nameAr ?? undefined } },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createMutation.mutate(
        { clinicId, name },
        { onSuccess: () => setOpen(false) },
      );
    }
  };

  const handleToggleActive = (dept: Department, nextActive: boolean) => {
    if (nextActive) reactivateMutation.mutate(dept.id);
    else deactivateMutation.mutate(dept.id);
  };

  const rowActions = (dept: Department) => (
    <>
      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(dept)}>
        <IconEdit className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-destructive hover:text-destructive"
        onClick={() => del.ask({ id: dept.id, name: dept.name })}
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
          placeholder="Search departments…"
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <IconAdd className="size-4 mr-1.5" />
          <span className="hidden sm:inline">Add Department</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="hidden md:block">
        <TableFrame>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Name</TableHead>
                <TableHead className="w-[20%]">Active</TableHead>
                <TableHead className="w-[20%]" />
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
                      <Skeleton className="h-5 w-9" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}

              {!isLoading && totalItems === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="p-0">
                    <EmptyState
                      icon={IconDepartment}
                      title={search ? 'No matching departments' : 'No departments yet'}
                      description={
                        search
                          ? 'Try a different search term.'
                          : "Add a department to organize your clinic's rooms and services."
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {pageItems.map((dept) => (
                <TableRow key={dept.id} className={!dept.isActive ? 'opacity-60' : undefined}>
                  <TableCell className="max-w-0 overflow-hidden">
                    <TruncatedText className="font-medium">{dept.name}</TruncatedText>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={dept.isActive}
                      onCheckedChange={(checked) => handleToggleActive(dept, checked)}
                      disabled={isToggling}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">{rowActions(dept)}</div>
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
            icon={IconDepartment}
            title={search ? 'No matching departments' : 'No departments yet'}
            description={
              search
                ? 'Try a different search term.'
                : "Add a department to organize your clinic's rooms and services."
            }
          />
        )}
        {pageItems.map((dept) => (
          <EntityMobileCard
            key={dept.id}
            title={dept.name}
            active={dept.isActive}
            onActiveChange={(checked) => handleToggleActive(dept, checked)}
            activeDisabled={isToggling}
            actions={rowActions(dept)}
            meta={
              <EntityMetaStat label="Status" value={dept.isActive ? 'Active' : 'Inactive'} />
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
            <DialogTitle>{editing ? 'Edit Department' : 'New Department'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
        warning="This will permanently remove this department along with its rooms, services, and appointments. This cannot be undone. If you just want to hide it temporarily, use the toggle instead and cancel here."
        finalWarning="This will permanently delete this department and every room, service, and appointment linked to it, including patient visit history. This action cannot be undone."
      />
    </div>
  );
}
