'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
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
  IconEdit,
  IconPayment,
} from '@/constants/icons';
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeactivatePaymentMethod,
  useDeletePaymentMethod,
  useReorderPaymentMethods,
} from '@/hooks/use-payment-methods';
import { useClinicId } from '@/hooks/use-clinic-id';
import { useListFilter } from '@/hooks/use-list-filter';
import type { PaymentMethod } from '@/services/payment-methods.service';

const searchFields = (m: PaymentMethod) => [m.name];

export default function PaymentMethodsPage() {
  const clinicId = useClinicId();
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
        <ArrowUp className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={reorderMutation.isPending}
        onClick={() => move(m.id, 1)}
      >
        <ArrowDown className="size-3.5" />
      </Button>
    </>
  );

  const rowActions = (m: PaymentMethod) => (
    <>
      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(m)}>
        <IconEdit className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-destructive hover:text-destructive"
        onClick={() => del.ask({ id: m.id, name: m.name })}
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
          placeholder="Search methods…"
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <IconAdd className="size-4 mr-1.5" />
          <span className="hidden sm:inline">Add Method</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="hidden md:block">
        <TableFrame>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[12%]">Order</TableHead>
                <TableHead className="w-[58%]">Name</TableHead>
                <TableHead className="w-[15%]">Active</TableHead>
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
                      title={search ? 'No matching methods' : 'No payment methods yet'}
                      description={
                        search
                          ? 'Try a different search term.'
                          : 'Add cash, card, or transfer so staff can mark appointments paid.'
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

      <div className="grid grid-cols-1 gap-2.5 md:hidden">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] w-full rounded-xl" />
          ))}
        {!isLoading && totalItems === 0 && (
          <EmptyState
            icon={IconPayment}
            title={search ? 'No matching methods' : 'No payment methods yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Add cash, card, or transfer so staff can mark appointments paid.'
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
            actions={
              <>
                {reorderActions(m)}
                {rowActions(m)}
              </>
            }
            meta={
              <>
                <EntityMetaStat label="Order" value={m.sortOrder + 1} />
                <EntityMetaStat
                  label="Status"
                  value={m.isActive ? 'Active' : 'Inactive'}
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
            <DialogTitle>{editing ? 'Edit payment method' : 'New payment method'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="pm-name">Name</Label>
            <Input
              id="pm-name"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cash, Visa, CliQ"
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
        warning="This permanently removes the payment method. Paid appointments keep their paid status but lose the method link. Prefer the Active toggle to hide it from pickers."
        finalWarning="This will permanently delete this payment method and clear it from appointments. This cannot be undone."
      />
    </div>
  );
}
