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
  TruncatedText,
  SearchInput,
  EntityMetaStat,
  EntityMobileCard,
} from '@/components/primitives';

import { SettingsAddButton, SettingsFormDialog, SettingsPageBack } from '@/components/blocks/settings/settings-navigation';
import {
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
  useReactivatePackage,
  useDeletePackage,
} from '@/hooks/api/use-packages';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useListFilter } from '@/hooks/shared/use-list-filter';
import { useCreateDialog } from '@/hooks/shared/use-create-dialog';
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
  const { t } = useLanguage();
  const { data: packages, isLoading } = usePackages(clinicId);
  const {
    search,
    setSearch,
    pageItems,
    pagination,
  } = useListFilter(packages, searchFields);

  const createMutation = useCreatePackage(clinicId);
  const updateMutation = useUpdatePackage(clinicId);
  const deactivateMutation = useDeactivatePackage(clinicId);
  const reactivateMutation = useReactivatePackage(clinicId);
  const deleteMutation = useDeletePackage(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const [open, setOpen] = useCreateDialog();
  const [editing, setEditing] = useState<ClinicPackage | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sessionCount, setSessionCount] = useState('');
  const [price, setPrice] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType | ''>('');
  const [discountValue, setDiscountValue] = useState('');

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isToggling = deactivateMutation.isPending || reactivateMutation.isPending;

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
    if (next) reactivateMutation.mutate(p.id);
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
    <div className="w-full min-w-0 space-y-4">
      <SettingsPageBack
        search={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t.settings.searchPackages}
          />
        }
        actions={<SettingsAddButton label={t.settings.addPackage} onClick={openCreate} />}
      />

      <ResourceTable
        rows={pageItems}
        rowKey={(p) => p.id}
        inactive={(p) => !p.isActive}
        isLoading={isLoading}
        pagination={pagination}
        empty={{
          icon: IconPackage,
          title: search ? t.settings.noMatchingPackages : t.settings.noPackages,
          description: search ? t.common.noResults : t.settings.packagesDesc,
        }}
        columns={[
          {
            id: 'name',
            header: t.common.name,
            className: 'w-[36%]',
            cellClassName: 'max-w-0 overflow-hidden',
            skeleton: 'h-4 w-32 max-w-full',
            render: (p) => (
              <>
                <TruncatedText className="font-medium">{p.name}</TruncatedText>
                {p.description && (
                  <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                )}
              </>
            ),
          },
          {
            id: 'sessions',
            header: t.settings.sessions,
            className: 'w-[12%]',
            cellClassName: 'text-muted-foreground',
            skeleton: 'h-4 w-10',
            render: (p) => (
              <>{p.sessionCount ?? '—'}</>
            ),
          },
          {
            id: 'fee',
            header: t.common.fee,
            className: 'w-[14%]',
            cellClassName: 'font-mono text-xs',
            skeleton: 'h-4 w-14',
            render: (p) => (
              <>{p.price != null ? `${Number(p.price).toFixed(3)} JOD` : '—'}</>
            ),
          },
          {
            id: 'discount',
            header: t.appointments.discount,
            className: 'w-[14%]',
            cellClassName: 'text-muted-foreground',
            skeleton: 'h-4 w-12',
            render: (p) => (
              <>{formatPackageDiscount(p)}</>
            ),
          },
          {
            id: 'active',
            header: t.common.active,
            className: 'w-[24%] text-end',
            skeleton: 'h-5 w-9 ms-auto',
            render: (p) => (
              <DirectoryActions
                name={p.name}
                active={p.isActive}
                disabled={isToggling}
                onChange={(checked) => handleToggle(p, checked)}
              >
                {rowActions(p)}
              </DirectoryActions>
            ),
          },
        ]}
        mobileCard={(p) => (
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
        )}
      />

      <SettingsFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={!!editing}
        addTitle={t.settings.addPackage}
        pending={isSaving}
        disabled={!name.trim()}
        onSubmit={handleSubmit}
      >
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
      </SettingsFormDialog>

      <TwoStepDeleteDialogs
        controller={del}
        onConfirm={(item) => deleteMutation.mutate(item.id, { onSuccess: del.clear })}
        isPending={deleteMutation.isPending}
        warning="This will permanently remove this package. Patients linked to it will keep their profile but lose the package default. Prefer the Active toggle to hide it temporarily."
        finalWarning="This will permanently delete this package. Linked patients will have their package cleared. This cannot be undone."
      />
    </div>
  );
}
