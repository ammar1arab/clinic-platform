'use client';

import { useState } from 'react';
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
} from '@/components/ui';
import {
  TwoStepDeleteDialogs,
  useTwoStepDelete,
} from '@/components/blocks/feedback';
import {
  RowActionsMenu,
  EmptyState,
  FormActions,
  TruncatedText,
  SearchInput,
  Pagination,
  BilingualNameFields,
  optionalArabicName,
} from '@/components/primitives';
import {
  TableFrame,
  EntityMetaStat,
  EntityMobileCard,
} from '@/components/blocks/data';
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
} from '@/hooks/api/use-departments';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useListFilter } from '@/hooks/shared/use-list-filter';
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
        { label: 'Edit', icon: IconEdit, onSelect: () => openEdit(dept) },
        {
          label: 'Delete',
          icon: IconDelete,
          variant: 'destructive',
          onSelect: () => del.ask({ id: dept.id, name: dept.name }),
        },
      ]}
    />
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
          <div className="space-y-3">
            <BilingualNameFields
              name={name}
              nameAr={nameAr}
              onNameChange={setName}
              onNameArChange={setNameAr}
            />
          </div>
          <DialogFooter>
            <FormActions
              variant="dialog"
              onCancel={() => setOpen(false)}
              submitLabel={editing ? 'Save' : 'Create'}
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
        warning="This will permanently remove this department along with its rooms, services, and appointments. This cannot be undone. If you just want to hide it temporarily, use the toggle instead and cancel here."
        finalWarning="This will permanently delete this department and every room, service, and appointment linked to it, including patient visit history. This action cannot be undone."
      />
    </div>
  );
}
