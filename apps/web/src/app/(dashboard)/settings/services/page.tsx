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
  IconService,
} from '@/constants/icons';
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeactivateService,
  useReactivateService,
  useDeleteService,
} from '@/hooks/use-services';
import { useDepartments } from '@/hooks/use-departments';
import { useClinicId } from '@/hooks/use-clinic-id';
import { useListFilter } from '@/hooks/use-list-filter';
import { ServiceItem } from '@/services/services.service';
import {
  BilingualNameFields,
  optionalArabicName,
} from '@/components/primitives/bilingual-name-fields';

const searchFields = (s: ServiceItem) => [s.name];

export default function ServicesPage() {
  const clinicId = useClinicId();
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

  const departmentName = (id: string | null) =>
    departments?.find((d) => d.id === id)?.name ?? '—';

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
    <>
      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(svc)}>
        <IconEdit className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-destructive hover:text-destructive"
        onClick={() => del.ask({ id: svc.id, name: svc.name })}
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
          placeholder="Search services…"
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <IconAdd className="size-4 mr-1.5" />
          <span className="hidden sm:inline">Add Service</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="hidden md:block">
        <TableFrame>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32%]">Name</TableHead>
                <TableHead className="w-[22%]">Department</TableHead>
                <TableHead className="w-[12%]">Duration</TableHead>
                <TableHead className="w-[14%]">Fee (JOD)</TableHead>
                <TableHead className="w-[10%]">Active</TableHead>
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
                      title={search ? 'No matching services' : 'No services yet'}
                      description={
                        search
                          ? 'Try a different search term.'
                          : 'Add a service to define appointment types, duration, and fees.'
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {pageItems.map((svc) => (
                <TableRow key={svc.id} className={!svc.isActive ? 'opacity-60' : undefined}>
                  <TableCell className="max-w-0 overflow-hidden">
                    <TruncatedText className="font-medium">{svc.name}</TruncatedText>
                  </TableCell>
                  <TableCell className="max-w-0 overflow-hidden text-muted-foreground">
                    <TruncatedText>{departmentName(svc.departmentId)}</TruncatedText>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {svc.durationMins} min
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {Number(svc.fee).toFixed(3)}
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

      <div className="grid grid-cols-1 gap-2.5 md:hidden">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] w-full rounded-xl" />
          ))}
        {!isLoading && totalItems === 0 && (
          <EmptyState
            icon={IconService}
            title={search ? 'No matching services' : 'No services yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Add a service to define appointment types, duration, and fees.'
            }
          />
        )}
        {pageItems.map((svc) => (
          <EntityMobileCard
            key={svc.id}
            title={svc.name}
            active={svc.isActive}
            onActiveChange={(checked) => handleToggleActive(svc, checked)}
            activeDisabled={isToggling}
            actions={rowActions(svc)}
            meta={
              <>
                <EntityMetaStat label="Department" value={departmentName(svc.departmentId)} />
                <EntityMetaStat label="Duration" value={`${svc.durationMins} min`} />
                <EntityMetaStat label="Fee" value={`${Number(svc.fee).toFixed(3)} JOD`} />
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
            <DialogTitle>{editing ? 'Edit Service' : 'New Service'}</DialogTitle>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={480}
                  value={durationMins}
                  onChange={(e) => setDurationMins(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fee">Fee (JOD)</Label>
                <Input
                  id="fee"
                  type="number"
                  step="0.001"
                  min={0}
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || !fee || isSaving}>
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
        warning="This will permanently remove this service and any appointments that use it. This cannot be undone. If you just want to hide it temporarily, use the toggle instead and cancel here."
        finalWarning="This will permanently delete this service and every appointment linked to it, including patient visit history. This action cannot be undone."
      />
    </div>
  );
}
