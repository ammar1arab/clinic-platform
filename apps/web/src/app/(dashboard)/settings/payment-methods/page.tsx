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
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeactivatePaymentMethod,
  useDeletePaymentMethod,
  useReorderPaymentMethods,
} from '@/hooks/api/use-payment-methods';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useListFilter } from '@/hooks/shared/use-list-filter';
import { useLanguage } from '@/providers';
import type { PaymentMethod } from '@/services/payment-methods.service';
import { IconAdd, IconArrowDown, IconArrowUp, IconDelete, IconEdit, IconPayment } from '@/constants/icons';

const searchFields = (m: PaymentMethod) => [m.name];

export default function PaymentMethodsPage() {
  const clinicId = useClinicId();
  const { t } = useLanguage();
  const { data: methods, isLoading } = usePaymentMethods(clinicId);
  const {
    search,
    setSearch,
    page,
    setPage,
    pageCount,
    pageItems,
    totalItems,
    pageSize,
  } = useListFilter(methods, searchFields);

  const createMutation = useCreatePaymentMethod(clinicId);
  const updateMutation = useUpdatePaymentMethod(clinicId);
  const deactivateMutation = useDeactivatePaymentMethod(clinicId);
  const deleteMutation = useDeletePaymentMethod(clinicId);
  const reorderMutation = useReorderPaymentMethods(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [name, setName] = useState('');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isToggling = deactivateMutation.isPending || updateMutation.isPending;
  const sorted = [...(methods ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setOpen(true);
  };

  const openEdit = (m: PaymentMethod) => {
    setEditing(m);
    setName(m.name);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: { name: name.trim() } },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createMutation.mutate(
        {
          clinicId,
          name: name.trim(),
          sortOrder: sorted.length,
        },
        { onSuccess: () => setOpen(false) },
      );
    }
  };

  const move = (id: string, dir: -1 | 1) => {
    const ids = sorted.map((m) => m.id);
    const idx = ids.indexOf(id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= ids.length) return;
    [ids[idx], ids[swap]] = [ids[swap], ids[idx]];
    reorderMutation.mutate(ids);
  };

  const handleToggle = (m: PaymentMethod, next: boolean) => {
    if (next) updateMutation.mutate({ id: m.id, data: { isActive: true } });
    else deactivateMutation.mutate(m.id);
  };

  const reorderActions = (m: PaymentMethod) => (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={reorderMutation.isPending}
        onClick={() => move(m.id, -1)}
      >
        <IconArrowUp className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={reorderMutation.isPending}
        onClick={() => move(m.id, 1)}
      >
        <IconArrowDown className="size-3.5" />
      </Button>
    </>
  );

  const rowActions = (m: PaymentMethod) => (
    <RowActionsMenu
      items={[
        { label: t.common.edit, icon: IconEdit, onSelect: () => openEdit(m) },
        {
          label: t.common.delete,
          icon: IconDelete,
          variant: 'destructive',
          onSelect: () => del.ask({ id: m.id, name: m.name }),
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
          placeholder={t.settings.searchPaymentMethods}
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <IconAdd className="size-4 me-1.5" />
          <span className="hidden sm:inline">{t.settings.addPaymentMethod}</span>
          <span className="sm:hidden">{t.common.add}</span>
        </Button>
      </div>

      <div className="hidden md:block">
        <TableFrame>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[12%]">{t.common.sort}</TableHead>
                <TableHead className="w-[58%]">{t.common.name}</TableHead>
                <TableHead className="w-[15%]">{t.common.active}</TableHead>
                <TableHead className="w-[15%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
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
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState
                      icon={IconPayment}
                      title={search ? t.settings.noMatchingPaymentMethods : t.settings.noPaymentMethods}
                      description={
                        search
                          ? t.common.noResults
                          : t.settings.paymentMethodsDesc
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {pageItems.map((m) => (
                <TableRow key={m.id} className={!m.isActive ? 'opacity-60' : undefined}>
                  <TableCell>
                    <div className="flex items-center gap-0.5">{reorderActions(m)}</div>
                  </TableCell>
                  <TableCell className="max-w-0 overflow-hidden">
                    <TruncatedText className="font-medium">{m.name}</TruncatedText>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={m.isActive}
                      onCheckedChange={(checked) => handleToggle(m, checked)}
                      disabled={isToggling}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">{rowActions(m)}</div>
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
            icon={IconPayment}
            title={search ? t.settings.noMatchingPaymentMethods : t.settings.noPaymentMethods}
            description={
              search
                ? t.common.noResults
                : t.settings.paymentMethodsDesc
            }
          />
        )}

        {pageItems.map((m) => (
          <EntityMobileCard
            key={m.id}
            title={m.name}
            active={m.isActive}
            onActiveChange={(checked) => handleToggle(m, checked)}
            activeDisabled={isToggling}
            actions={rowActions(m)}
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
            <DialogTitle>{editing ? t.common.edit : t.settings.addPaymentMethod}</DialogTitle>
          </DialogHeader>
          <FormField label={t.common.name} htmlFor="pm-name">
            <Input
              id="pm-name"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cash, Visa, CliQ"
            />
          </FormField>
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
        warning="This permanently removes the payment method. Paid appointments keep their paid status but lose the method link. Prefer the Active toggle to hide it from pickers."
        finalWarning="This will permanently delete this payment method and clear it from appointments. This cannot be undone."
      />
    </div>
  );
}
