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
import { DatePicker } from '@/components/primitives/date-picker';
import {
  EntityMetaStat,
  EntityMobileCard,
} from '@/components/blocks/data/entity-mobile-card';
import {
  IconAdd,
  IconDelete,
  IconDiscount,
  IconEdit,
} from '@/constants/icons';
import {
  useDiscountCodes,
  useCreateDiscountCode,
  useUpdateDiscountCode,
  useDeactivateDiscountCode,
  useDeleteDiscountCode,
} from '@/hooks/use-discount-codes';
import { useClinicId } from '@/hooks/use-clinic-id';
import { useListFilter } from '@/hooks/use-list-filter';
import type { DiscountCode } from '@/services/discount-codes.service';
import type { DiscountType } from '@/services/appointments.service';

const searchFields = (c: DiscountCode) => [c.code];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

function formatDiscount(c: DiscountCode) {
  return c.discountType === 'percentage'
    ? `${Number(c.discountValue)}%`
    : Number(c.discountValue).toFixed(3);
}

export default function DiscountCodesPage() {
  const clinicId = useClinicId();
  const { data: codes, isLoading } = useDiscountCodes(clinicId);
  const {
    search,
    setSearch,
    page,
    setPage,
    pageCount,
    pageItems,
    totalItems,
    pageSize,
  } = useListFilter(codes, searchFields);

  const createMutation = useCreateDiscountCode(clinicId);
  const updateMutation = useUpdateDiscountCode(clinicId);
  const deactivateMutation = useDeactivateDiscountCode(clinicId);
  const deleteMutation = useDeleteDiscountCode(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DiscountCode | null>(null);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isToggling = deactivateMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setEditing(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMaxUses('');
    setValidFrom('');
    setValidTo('');
    setOpen(true);
  };

  const openEdit = (c: DiscountCode) => {
    setEditing(c);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(String(Number(c.discountValue)));
    setMaxUses(c.maxUses != null ? String(c.maxUses) : '');
    setValidFrom(c.validFrom ? c.validFrom.slice(0, 10) : '');
    setValidTo(c.validTo ? c.validTo.slice(0, 10) : '');
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!code.trim() || !discountValue) return;
    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      maxUses: maxUses ? Number(maxUses) : null,
      validFrom: validFrom || null,
      validTo: validTo || null,
    };
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createMutation.mutate(
        {
          clinicId,
          code: payload.code,
          discountType: payload.discountType,
          discountValue: payload.discountValue,
          maxUses: maxUses ? Number(maxUses) : undefined,
          validFrom: validFrom || undefined,
          validTo: validTo || undefined,
        },
        { onSuccess: () => setOpen(false) },
      );
    }
  };

  const handleToggle = (c: DiscountCode, next: boolean) => {
    if (next) updateMutation.mutate({ id: c.id, data: { isActive: true } });
    else deactivateMutation.mutate(c.id);
  };

  const rowActions = (c: DiscountCode) => (
    <>
      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(c)}>
        <IconEdit className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-destructive hover:text-destructive"
        onClick={() => del.ask({ id: c.id, name: c.code })}
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
          placeholder="Search codes…"
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <IconAdd className="size-4 mr-1.5" />
          <span className="hidden sm:inline">Add Code</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="hidden md:block">
        <TableFrame>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[24%]">Code</TableHead>
                <TableHead className="w-[14%]">Discount</TableHead>
                <TableHead className="w-[14%]">Uses</TableHead>
                <TableHead className="w-[14%]">Valid from</TableHead>
                <TableHead className="w-[14%]">Valid to</TableHead>
                <TableHead className="w-[10%]">Active</TableHead>
                <TableHead className="w-[10%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
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
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={IconDiscount}
                      title={search ? 'No matching codes' : 'No discount codes yet'}
                      description={
                        search
                          ? 'Try a different search term.'
                          : 'Create reusable codes with optional date windows and usage caps.'
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {pageItems.map((c) => (
                <TableRow key={c.id} className={!c.isActive ? 'opacity-60' : undefined}>
                  <TableCell className="max-w-0 overflow-hidden">
                    <TruncatedText className="font-medium font-mono">{c.code}</TruncatedText>
                  </TableCell>
                  <TableCell>{formatDiscount(c)}</TableCell>
                  <TableCell>
                    {c.usedCount}
                    {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatDate(c.validFrom)}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatDate(c.validTo)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={c.isActive}
                      onCheckedChange={(checked) => handleToggle(c, checked)}
                      disabled={isToggling}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">{rowActions(c)}</div>
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
            icon={IconDiscount}
            title={search ? 'No matching codes' : 'No discount codes yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Create reusable codes with optional date windows and usage caps.'
            }
          />
        )}
        {pageItems.map((c) => (
          <EntityMobileCard
            key={c.id}
            title={<span className="font-mono">{c.code}</span>}
            active={c.isActive}
            onActiveChange={(checked) => handleToggle(c, checked)}
            activeDisabled={isToggling}
            actions={rowActions(c)}
            meta={
              <>
                <EntityMetaStat label="Discount" value={formatDiscount(c)} />
                <EntityMetaStat
                  label="Uses"
                  value={
                    <>
                      {c.usedCount}
                      {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                    </>
                  }
                />
                <EntityMetaStat label="Valid from" value={formatDate(c.validFrom)} />
                <EntityMetaStat label="Valid to" value={formatDate(c.validTo)} />
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
            <DialogTitle>{editing ? 'Edit discount code' : 'New discount code'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="dc-code">Code</Label>
              <Input
                id="dc-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER10"
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) => setDiscountType(v as DiscountType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dc-value">Value</Label>
                <Input
                  id="dc-value"
                  type="number"
                  min={0}
                  step="0.001"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-max">Max uses (optional)</Label>
              <Input
                id="dc-max"
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited if empty"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valid from</Label>
                <DatePicker value={validFrom} onChange={setValidFrom} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label>Valid to</Label>
                <DatePicker value={validTo} onChange={setValidTo} placeholder="Optional" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave dates empty for no window. Validation rejects expired, upcoming, inactive, or
              maxed-out codes when applying to appointments.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!code.trim() || !discountValue || isSaving}
            >
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
        warning="This permanently removes the code. Past appointments keep their discount amounts but lose the code link. Prefer the Active toggle to retire a code temporarily."
        finalWarning="This will permanently delete this discount code and clear it from patients and appointments. This cannot be undone."
      />
    </div>
  );
}
