'use client';

import { useState } from 'react';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/primitives';
import { ResourceTable } from '@/components/primitives';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  } from '@/components/ui';
import {
  DirectoryActions,
  RowActionsMenu,
  FormField,
  SearchInput,
  DatePicker,
  EntityMetaStat,
  EntityMobileCard,
} from '@/components/primitives';

import { SettingsAddButton, SettingsFormDialog, SettingsPageBack } from '@/components/blocks/settings/settings-navigation';
import {
  IconDelete,
  IconDiscount,
  IconEdit,
} from '@/constants/icons';
import {
  useDiscountCodes,
  useCreateDiscountCode,
  useUpdateDiscountCode,
  useDeactivateDiscountCode,
  useReactivateDiscountCode,
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
  const { t } = useLanguage();
  const { data: codes, isLoading } = useDiscountCodes(clinicId);
  const {
    search,
    setSearch,
    pageItems,
    pagination,
  } = useListFilter(codes, searchFields);

  const createMutation = useCreateDiscountCode(clinicId);
  const updateMutation = useUpdateDiscountCode(clinicId);
  const deactivateMutation = useDeactivateDiscountCode(clinicId);
  const reactivateMutation = useReactivateDiscountCode(clinicId);
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
  const isToggling = deactivateMutation.isPending || reactivateMutation.isPending;

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
    if (next) reactivateMutation.mutate(c.id);
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
    <div className="page-fill-always min-w-0 gap-4">
      <SettingsPageBack
        search={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t.settings.searchPromocodes}
          />
        }
        actions={<SettingsAddButton label={t.settings.addPromocode} onClick={openCreate} />}
      />

      <ResourceTable
        rows={pageItems}
        rowKey={(c) => c.id}
        inactive={(c) => !c.isActive}
        isLoading={isLoading}
        pagination={pagination}
        empty={{
          icon: IconDiscount,
          title: search ? t.settings.noMatchingDiscountCodes : t.settings.noDiscountCodes,
          description: search ? t.common.noResults : t.settings.discountCodesDesc,
        }}
        columns={[
          {
            id: 'code',
            header: t.settings.code,
            className: 'w-[24%]',
            cellClassName: 'max-w-0 overflow-hidden',
            skeleton: 'h-4 w-20',
            render: (c) => (
              <span className="font-mono font-medium">{c.code}</span>
            ),
          },
          {
            id: 'discount',
            header: t.appointments.discount,
            className: 'w-[14%]',
            cellClassName: 'text-muted-foreground',
            skeleton: 'h-4 w-16',
            render: (c) => (
              <>{formatDiscount(c)}</>
            ),
          },
          {
            id: 'uses',
            header: t.settings.uses,
            className: 'w-[14%]',
            cellClassName: 'text-muted-foreground',
            skeleton: 'h-4 w-12',
            render: (c) => (
              <>
                {c.usedCount}
                {c.maxUses != null ? ` / ${c.maxUses}` : ''}
              </>
            ),
          },
          {
            id: 'validFrom',
            header: t.settings.validFrom,
            className: 'w-[14%]',
            cellClassName: 'text-muted-foreground',
            skeleton: 'h-4 w-16',
            render: (c) => (
              <>{formatDate(c.validFrom)}</>
            ),
          },
          {
            id: 'validTo',
            header: t.settings.validTo,
            className: 'w-[14%]',
            cellClassName: 'text-muted-foreground',
            skeleton: 'h-4 w-16',
            render: (c) => (
              <>{formatDate(c.validTo)}</>
            ),
          },
          {
            id: 'active',
            header: t.common.active,
            className: 'w-[20%] text-end',
            skeleton: 'h-5 w-9 ms-auto',
            render: (c) => (
              <DirectoryActions
                name={c.code}
                active={c.isActive}
                disabled={isToggling}
                onChange={(checked) => handleToggle(c, checked)}
              >
                {rowActions(c)}
              </DirectoryActions>
            ),
          },
        ]}
        mobileCard={(c) => (
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
        )}
      />

      <SettingsFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={!!editing}
        addTitle={t.settings.addPromocode}
        pending={isSaving}
        disabled={!code.trim() || !discountValue}
        onSubmit={handleSubmit}
      >
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
      </SettingsFormDialog>

      <TwoStepDeleteDialogs
        controller={del}
        onConfirm={(item) => deleteMutation.mutate(item.id, { onSuccess: del.clear })}
        isPending={deleteMutation.isPending}
        warning="This permanently removes the code. Past appointments keep their discount amounts but lose the code link. Prefer the Active toggle to retire a code temporarily."
        finalWarning="This will permanently delete this promocode and clear it from patients and appointments. This cannot be undone."
      />
    </div>
  );
}
