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
  } from '@/components/ui';
import {
  RowActionsMenu,
  EmptyState,
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
  IconDepartment,
  IconEdit,
} from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
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
import type { Department } from '@/services/departments.service';

const searchFields = (d: Department) => [d.name];

export default function DepartmentsPage() {
  const clinicId = useClinicId();
  const { t, lang } = useLanguage();
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
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4">
      <PageBack backHref={ROUTES.SETTINGS} backLabel={t.settings.title} />

      <div className="flex items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t.settings.searchDepartments}
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <IconAdd className="size-4 me-1.5" />
          <span className="hidden sm:inline">{t.settings.addDepartment}</span>
          <span className="sm:hidden">{t.common.add}</span>
        </Button>
      </div>

      <div className="hidden md:block">
        <TableFrame>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">{t.common.name}</TableHead>
                <TableHead className="w-[20%]">{t.common.active}</TableHead>
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
                      title={search ? t.settings.noMatchingDepartments : t.settings.noDepartments}
                      description={
                        search
                          ? t.common.noResults
                          : t.settings.departmentsDesc
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {pageItems.map((dept) => (
                <TableRow key={dept.id} className={!dept.isActive ? 'opacity-60' : undefined}>
                  <TableCell className="max-w-0 overflow-hidden">
                    <TruncatedText className="font-medium">
                      {lang === 'ar' && dept.nameAr ? dept.nameAr : dept.name}
                    </TruncatedText>
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

      <div className="space-y-2 md:hidden">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/70 bg-card p-4">
              <Skeleton className="h-4 w-28" />
            </div>
          ))}

        {!isLoading && totalItems === 0 && (
          <EmptyState
            icon={IconDepartment}
            title={search ? t.settings.noMatchingDepartments : t.settings.noDepartments}
            description={
              search
                ? t.common.noResults
                : t.settings.departmentsDesc
            }
          />
        )}

        {pageItems.map((dept) => (
          <EntityMobileCard
            key={dept.id}
            title={lang === 'ar' && dept.nameAr ? dept.nameAr : dept.name}
            active={dept.isActive}
            onActiveChange={(checked: boolean) => handleToggleActive(dept, checked)}
            activeDisabled={isToggling}
            actions={rowActions(dept)}
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
              {editing ? t.common.edit : t.settings.addDepartment}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
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
        warning="This will permanently remove this department along with its rooms, services, and appointments. This cannot be undone. If you just want to hide it temporarily, use the toggle instead and cancel here."
        finalWarning="This will permanently delete this department and every room, service, and appointment linked to it, including patient visit history. This action cannot be undone."
      />
    </div>
  );
}
