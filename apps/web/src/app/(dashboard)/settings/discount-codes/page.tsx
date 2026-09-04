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
  DatePicker,
  PageBack,
  TableFrame,
  EntityMetaStat,
  EntityMobileCard,
} from '@/components/primitives';

import { ROUTES } from '@/constants/routes';
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
} from '@/hooks/api/use-discount-codes';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useListFilter } from '@/hooks/shared/use-list-filter';
import { useLanguage } from '@/providers';
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
  const { t, lang } = useLanguage();
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
    <RowActionsMenu
      items={[
        { label: t.common.edit, icon: IconEdit, onSelect: () => openEdit(c) },
        {
          label: t.common.delete,
          icon: IconDelete,
          variant: 'destructive',
          onSelect: () => del.ask({ id: c.id, name: c.code }),
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
          placeholder={t.settings.searchPromocodes}
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Button size="sm" onClick={openCreate} className="shrink-0">
          <IconAdd className="size-4 me-1.5" />
          <span className="hidden sm:inline">{t.settings.addPromocode}</span>
          <span className="sm:hidden">{t.common.add}</span>
        </Button>
      </div>

      <div className="hidden md:block">
        <TableFrame>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[24%]">{t.settings.code}</TableHead>
                <TableHead className="w-[14%]">{t.appointments.discount}</TableHead>
                <TableHead className="w-[14%]">{t.settings.uses}</TableHead>
                <TableHead className="w-[14%]">{t.settings.validFrom}</TableHead>
                <TableHead className="w-[14%]">{t.settings.validTo}</TableHead>
                <TableHead className="w-[10%]">{t.common.active}</TableHead>
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
                      title={search ? t.settings.noMatchingDiscountCodes : t.settings.noDiscountCodes}
                      description={
                        search
                          ? t.common.noResults
                          : t.settings.discountCodesDesc
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {pageItems.map((c) => (
                <TableRow key={c.id} className={!c.isActive ? 'opacity-60' : undefined}>
                  <TableCell className="max-w-0 overflow-hidden">
                    <span className="font-mono font-medium">{c.code}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDiscount(c)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.usedCount}
                    {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.validFrom)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.validTo)}</TableCell>
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

      <div className="space-y-2 md:hidden">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/70 bg-card p-4">
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        {!isLoading && totalItems === 0 && (
          <EmptyState
            icon={IconDiscount}
            title={search ? t.settings.noMatchingDiscountCodes : t.settings.noDiscountCodes}
            description={
              search
                ? t.common.noResults
                : t.settings.discountCodesDesc
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
                <EntityMetaStat label={t.appointments.discount} value={formatDiscount(c)} />
                <EntityMetaStat
                  label={t.settings.uses}
                  value={
                    <>
                      {c.usedCount}
                      {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                    </>
                  }
                />
                <EntityMetaStat label={t.settings.validFrom} value={formatDate(c.validFrom)} />
                <EntityMetaStat label={t.settings.validTo} value={formatDate(c.validTo)} />
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
            <DialogTitle>{editing ? t.common.edit : t.settings.addPromocode}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <FormField label={t.settings.code} htmlFor="dc-code">
              <Input
                id="dc-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER10"
                className="font-mono"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.appointments.discountType}>
                <Select
                  value={discountType}
                  onValueChange={(v) => setDiscountType(v as DiscountType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t.appointments.percentage}</SelectItem>
                    <SelectItem value="fixed">{t.appointments.fixed}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label={t.appointments.discountValue} htmlFor="dc-value">
                <Input
                  id="dc-value"
                  type="number"
                  min={0}
                  step="0.001"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </FormField>
            </div>
            <FormField label={`${t.settings.maxUses} (${t.common.optional})`} htmlFor="dc-max">
              <Input
                id="dc-max"
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder={t.settings.unlimitedIfEmpty}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.settings.validFrom}>
                <DatePicker value={validFrom} onChange={setValidFrom} placeholder={t.common.optional} />
              </FormField>
              <FormField label={t.settings.validTo}>
                <DatePicker value={validTo} onChange={setValidTo} placeholder={t.common.optional} />
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <FormActions
              variant="dialog"
              onCancel={() => setOpen(false)}
              submitLabel={editing ? t.common.save : t.common.create}
              pending={isSaving}
              disabled={!code.trim() || !discountValue}
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
        warning="This permanently removes the code. Past appointments keep their discount amounts but lose the code link. Prefer the Active toggle to retire a code temporarily."
        finalWarning="This will permanently delete this promocode and clear it from patients and appointments. This cannot be undone."
      />
    </div>
  );
}
