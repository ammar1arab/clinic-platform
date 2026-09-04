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
  Input,
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
  IconService,
} from '@/constants/icons';
import { FORM_NONE } from '@/constants/form';
import { ROUTES } from '@/constants/routes';
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
    page,
    setPage,
    pageCount,
    pageItems,
    totalItems,
    pageSize,
  } = useListFilter(services, searchFields);
  const createMutation = useCreateService(clinicId);
  const updateMutation = useUpdateService(clinicId);
  const deactivateMutation = useDeactivateService(clinicId);
  const reactivateMutation = useReactivateService(clinicId);
  const deleteMutation = useDeleteService(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const [open, setOpen] = useState(false);
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
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4">
      <PageBack backHref={ROUTES.SETTINGS} backLabel={t.settings.title} />

      <div className="flex items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t.settings.searchServices}
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <IconAdd className="size-4 me-1.5" />
          <span className="hidden sm:inline">{t.settings.addService}</span>
          <span className="sm:hidden">{t.common.add}</span>
        </Button>
      </div>

      <div className="hidden md:block">
        <TableFrame>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32%]">{t.common.name}</TableHead>
                <TableHead className="w-[22%]">{t.settings.departments}</TableHead>
                <TableHead className="w-[12%]">{t.common.duration}</TableHead>
                <TableHead className="w-[14%]">{t.common.fee} (JOD)</TableHead>
                <TableHead className="w-[10%]">{t.common.active}</TableHead>
                <TableHead className="w-[10%]" />
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
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-9" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}

              {!isLoading && totalItems === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={IconService}
                      title={search ? t.settings.noMatchingServices : t.settings.noServices}
                      description={
                        search
                          ? t.common.noResults
                          : t.settings.servicesDesc
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {pageItems.map((svc) => (
                <TableRow key={svc.id} className={!svc.isActive ? 'opacity-60' : undefined}>
                  <TableCell className="max-w-0 overflow-hidden">
                    <TruncatedText className="font-medium">
                      {lang === 'ar' && svc.nameAr ? svc.nameAr : svc.name}
                    </TruncatedText>
                  </TableCell>
                  <TableCell className="max-w-0 overflow-hidden text-muted-foreground">
                    <TruncatedText>{departmentName(svc.departmentId)}</TruncatedText>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {svc.durationMins}{t.common.minsCompact}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {Number(svc.fee).toFixed(3)} JOD
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={svc.isActive}
                      onCheckedChange={(checked) => handleToggleActive(svc, checked)}
                      disabled={isToggling}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">{rowActions(svc)}</div>
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
            icon={IconService}
            title={search ? t.settings.noMatchingServices : t.settings.noServices}
            description={
              search
                ? t.common.noResults
                : t.settings.servicesDesc
            }
          />
        )}
        {pageItems.map((svc) => (
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
              {editing ? t.common.edit : t.settings.addService}
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
          <DialogFooter>
            <FormActions
              variant="dialog"
              onCancel={() => setOpen(false)}
              submitLabel={editing ? t.common.save : t.common.create}
              pending={isSaving}
              disabled={!name.trim() || !fee}
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
        warning="This will permanently remove this service and any appointments that use it. This cannot be undone. If you just want to hide it temporarily, use the toggle instead and cancel here."
        finalWarning="This will permanently delete this service and every appointment linked to it, including patient visit history. This action cannot be undone."
      />
    </div>
  );
}
