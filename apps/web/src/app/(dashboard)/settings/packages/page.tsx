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
  PageBack,
  TableFrame,
  EntityMetaStat,
  EntityMobileCard,
} from '@/components/primitives';

import { ROUTES } from '@/constants/routes';
import {
  IconAdd,
  IconDelete,
  IconEdit,
  IconPackage,
} from '@/constants/icons';
import { FORM_NONE } from '@/constants/form';
import {
  usePackages,
  useCreatePackage,
  useUpdatePackage,
  useDeactivatePackage,
  useDeletePackage,
} from '@/hooks/api/use-packages';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useListFilter } from '@/hooks/shared/use-list-filter';
import { useLanguage } from '@/providers';
import type { ClinicPackage } from '@/services/packages.service';
import type { DiscountType } from '@/services/appointments.service';

const searchFields = (p: ClinicPackage) => [p.name, p.description ?? ''];

function formatPackageDiscount(p: ClinicPackage) {
  if (!p.discountType || p.discountValue == null) return '—';
  return p.discountType === 'percentage'
    ? `${Number(p.discountValue)}%`
    : Number(p.discountValue).toFixed(3);
}

export default function PackagesPage() {
  const clinicId = useClinicId();
  const { t, lang } = useLanguage();
  const { data: packages, isLoading } = usePackages(clinicId);
  const {
    search,
    setSearch,
    page,
    setPage,
    pageCount,
    pageItems,
    totalItems,
    pageSize,
  } = useListFilter(packages, searchFields);

  const createMutation = useCreatePackage(clinicId);
  const updateMutation = useUpdatePackage(clinicId);
  const deactivateMutation = useDeactivatePackage(clinicId);
  const deleteMutation = useDeletePackage(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClinicPackage | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sessionCount, setSessionCount] = useState('');
  const [price, setPrice] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType | ''>('');
  const [discountValue, setDiscountValue] = useState('');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isToggling = deactivateMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setSessionCount('');
    setPrice('');
    setDiscountType('');
    setDiscountValue('');
    setOpen(true);
  };

  const openEdit = (p: ClinicPackage) => {
    setEditing(p);
    setName(p.name);
    setDescription(p.description ?? '');
    setSessionCount(p.sessionCount != null ? String(p.sessionCount) : '');
    setPrice(p.price != null ? String(Number(p.price)) : '');
    setDiscountType(p.discountType ?? '');
    setDiscountValue(
      p.discountValue != null ? String(Number(p.discountValue)) : '',
    );
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      sessionCount: sessionCount ? Number(sessionCount) : undefined,
      price: price ? Number(price) : undefined,
      discountType: discountType || undefined,
      discountValue: discountValue ? Number(discountValue) : undefined,
    };
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createMutation.mutate(
        { clinicId, ...payload, sortOrder: (packages?.length ?? 0) },
        { onSuccess: () => setOpen(false) },
      );
    }
  };

  const handleToggle = (p: ClinicPackage, next: boolean) => {
    if (next) updateMutation.mutate({ id: p.id, data: { isActive: true } });
    else deactivateMutation.mutate(p.id);
  };

  const rowActions = (p: ClinicPackage) => (
    <RowActionsMenu
      items={[
        { label: t.common.edit, icon: IconEdit, onSelect: () => openEdit(p) },
        {
          label: t.common.delete,
          icon: IconDelete,
          variant: 'destructive',
          onSelect: () => del.ask({ id: p.id, name: p.name }),
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
          placeholder={t.settings.searchPackages}
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <IconAdd className="size-4 me-1.5" />
          <span className="hidden sm:inline">{t.settings.addPackage}</span>
          <span className="sm:hidden">{t.common.add}</span>
        </Button>
      </div>

      <div className="hidden md:block">
        <TableFrame>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[36%]">{t.common.name}</TableHead>
                <TableHead className="w-[12%]">{t.settings.sessions}</TableHead>
                <TableHead className="w-[14%]">{t.common.fee}</TableHead>
                <TableHead className="w-[14%]">{t.appointments.discount}</TableHead>
                <TableHead className="w-[10%]">{t.common.active}</TableHead>
                <TableHead className="w-[14%]" />
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
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-14" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
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
                      icon={IconPackage}
                      title={search ? t.settings.noMatchingPackages : t.settings.noPackages}
                      description={
                        search
                          ? t.common.noResults
                          : t.settings.packagesDesc
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {pageItems.map((p) => (
                <TableRow key={p.id} className={!p.isActive ? 'opacity-60' : undefined}>
                  <TableCell className="max-w-0 overflow-hidden">
                    <TruncatedText className="font-medium">{p.name}</TruncatedText>
                    {p.description && (
                      <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.sessionCount ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {p.price != null ? `${Number(p.price).toFixed(3)} JOD` : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPackageDiscount(p)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={p.isActive}
                      onCheckedChange={(checked) => handleToggle(p, checked)}
                      disabled={isToggling}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">{rowActions(p)}</div>
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
            icon={IconPackage}
            title={search ? t.settings.noMatchingPackages : t.settings.noPackages}
            description={
              search
                ? t.common.noResults
                : t.settings.packagesDesc
            }
          />
        )}
        {pageItems.map((p) => (
          <EntityMobileCard
            key={p.id}
            title={p.name}
            subtitle={p.description ?? undefined}
            active={p.isActive}
            onActiveChange={(checked) => handleToggle(p, checked)}
            activeDisabled={isToggling}
            actions={rowActions(p)}
            meta={
              <>
                <EntityMetaStat label={t.settings.sessions} value={p.sessionCount ?? '—'} />
                <EntityMetaStat
                  label={t.common.fee}
                  value={p.price != null ? Number(p.price).toFixed(3) : '—'}
                />
                <EntityMetaStat label={t.appointments.discount} value={formatPackageDiscount(p)} />
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
            <DialogTitle>{editing ? t.common.edit : t.settings.addPackage}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <FormField label={t.common.name} htmlFor="pkg-name">
              <Input
                id="pkg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 5-session physio pack"
              />
            </FormField>
            <FormField label={t.common.description} htmlFor="pkg-desc">
              <Input
                id="pkg-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Initial assessment + 4 follow-ups"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.settings.sessions} htmlFor="pkg-sessions">
                <Input
                  id="pkg-sessions"
                  type="number"
                  min={1}
                  value={sessionCount}
                  onChange={(e) => setSessionCount(e.target.value)}
                />
              </FormField>
              <FormField label={t.common.fee} htmlFor="pkg-price">
                <Input
                  id="pkg-price"
                  type="number"
                  min={0}
                  step="0.001"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.appointments.discountType}>
                <Select
                  value={discountType || FORM_NONE}
                  onValueChange={(v) =>
                    setDiscountType(v === FORM_NONE ? '' : (v as DiscountType))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.common.none} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FORM_NONE}>{t.common.none}</SelectItem>
                    <SelectItem value="fixed">{t.appointments.fixed}</SelectItem>
                    <SelectItem value="percentage">{t.appointments.percentage}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label={t.appointments.discountValue} htmlFor="pkg-disc">
                <Input
                  id="pkg-disc"
                  type="number"
                  min={0}
                  step="0.001"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  disabled={!discountType}
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
        warning="This will permanently remove this package. Patients linked to it will keep their profile but lose the package default. Prefer the Active toggle to hide it temporarily."
        finalWarning="This will permanently delete this package. Linked patients will have their package cleared. This cannot be undone."
      />
    </div>
  );
}
