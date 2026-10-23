'use client';

import { useState } from 'react';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/primitives';
import { ResourceTable } from '@/components/primitives';
import {
  Button,
  Input,
  } from '@/components/ui';
import {
  DirectoryActions,
  RowActionsMenu,
  FormField,
  TruncatedText,
  SearchInput,
  EntityMobileCard,
} from '@/components/primitives';

import { SettingsAddButton, SettingsFormDialog, SettingsPageBack } from '@/components/blocks/settings/settings-navigation';
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeactivatePaymentMethod,
  useReactivatePaymentMethod,
  useDeletePaymentMethod,
  useReorderPaymentMethods,
} from '@/hooks/api/use-payment-methods';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useListFilter } from '@/hooks/shared/use-list-filter';
import { useLanguage } from '@/providers';
import type { PaymentMethod } from '@/services/payment-methods.service';
import { IconArrowDown, IconArrowUp, IconDelete, IconEdit, IconPayment } from '@/constants/icons';

const searchFields = (m: PaymentMethod) => [m.name];

export default function PaymentMethodsPage() {
  const clinicId = useClinicId();
  const { t } = useLanguage();
  const { data: methods, isLoading } = usePaymentMethods(clinicId);
  const {
    search,
    setSearch,
    pageItems,
    pagination,
  } = useListFilter(methods, searchFields);

  const createMutation = useCreatePaymentMethod(clinicId);
  const updateMutation = useUpdatePaymentMethod(clinicId);
  const deactivateMutation = useDeactivatePaymentMethod(clinicId);
  const reactivateMutation = useReactivatePaymentMethod(clinicId);
  const deleteMutation = useDeletePaymentMethod(clinicId);
  const reorderMutation = useReorderPaymentMethods(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [name, setName] = useState('');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isToggling = deactivateMutation.isPending || reactivateMutation.isPending;
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
    if (next) reactivateMutation.mutate(m.id);
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
    <div className="page-fill-always min-w-0 gap-4">
      <SettingsPageBack
        search={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t.settings.searchPaymentMethods}
          />
        }
        actions={<SettingsAddButton label={t.settings.addPaymentMethod} onClick={openCreate} />}
      />

      <ResourceTable
        rows={pageItems}
        rowKey={(m) => m.id}
        inactive={(m) => !m.isActive}
        isLoading={isLoading}
        pagination={pagination}
        empty={{
          icon: IconPayment,
          title: search ? t.settings.noMatchingPaymentMethods : t.settings.noPaymentMethods,
          description: search ? t.common.noResults : t.settings.paymentMethodsDesc,
        }}
        columns={[
          {
            id: 'sort',
            header: t.common.sort,
            className: 'w-[12%]',
            skeleton: 'h-4 w-10',
            render: (m) => (
              <div className="flex items-center gap-0.5">{reorderActions(m)}</div>
            ),
          },
          {
            id: 'name',
            header: t.common.name,
            className: 'w-[58%]',
            cellClassName: 'max-w-0 overflow-hidden',
            skeleton: 'h-4 w-32 max-w-full',
            render: (m) => (
              <TruncatedText className="font-medium">{m.name}</TruncatedText>
            ),
          },
          {
            id: 'active',
            header: t.common.active,
            className: 'w-[30%] text-end',
            skeleton: 'h-5 w-9 ms-auto',
            render: (m) => (
              <DirectoryActions
                name={m.name}
                active={m.isActive}
                disabled={isToggling}
                onChange={(checked) => handleToggle(m, checked)}
              >
                {rowActions(m)}
              </DirectoryActions>
            ),
          },
        ]}
        mobileCard={(m) => (
          <EntityMobileCard
            key={m.id}
            title={m.name}
            active={m.isActive}
            onActiveChange={(checked) => handleToggle(m, checked)}
            activeDisabled={isToggling}
            actions={rowActions(m)}
          />
        )}
      />

      <SettingsFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={!!editing}
        addTitle={t.settings.addPaymentMethod}
        pending={isSaving}
        disabled={!name.trim()}
        onSubmit={handleSubmit}
      >
        <FormField label={t.common.name} htmlFor="pm-name">
          <Input
            id="pm-name"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cash, Visa, CliQ"
          />
        </FormField>
      </SettingsFormDialog>

      <TwoStepDeleteDialogs
        controller={del}
        onConfirm={(item) => deleteMutation.mutate(item.id, { onSuccess: del.clear })}
        isPending={deleteMutation.isPending}
        warning="This permanently removes the payment method. Paid appointments keep their paid status but lose the method link. Prefer the Active toggle to hide it from pickers."
        finalWarning="This will permanently delete this payment method and clear it from appointments. This cannot be undone."
      />
    </div>
  );
}
