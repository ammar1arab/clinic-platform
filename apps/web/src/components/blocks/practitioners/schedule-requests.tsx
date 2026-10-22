'use client';

import { useState } from 'react';
import { ROLE, type ScheduleRequest } from '@clinic/types';
import { Badge, Button, Popover, SelectItem } from '@/components/ui';
import {
  DIRECTORY_ACTION_CLASS,
  DirectoryTable,
  EmptyState,
  EntityMobileCard,
  ErrorState,
  FilterPanel,
  FilterSelect,
  FilterTrigger,
  Pagination,
  PreviewableAvatar,
  SearchInput,
  TableFrame,
  TableSkeleton,
  TruncatedText,
  type DirectoryColumn,
} from '@/components/primitives';
import { SettingsPageBack } from '@/components/blocks/settings/settings-navigation';
import { IconAdd, IconCalendarClock } from '@/constants/icons';
import { useClinicRealtime } from '@/hooks/api/use-clinic-realtime';
import { useScheduleRequestMutation, useScheduleRequests } from '@/hooks/api/use-practitioners';
import { formatDateTime } from '@/lib/datetime';
import { getStaffName } from '@/i18n';
import { useAuth, useLanguage } from '@/providers';
import { useSessionStorageState } from '@/hooks/shared/use-session-storage-state';
import { DeclineRequestDialog, ScheduleRequestDialog } from './schedule-request-dialogs';

type Group = 'pending' | 'history';

export function ScheduleRequestsPage({ doctorId, initialGroup = 'pending' }: { doctorId?: string; initialGroup?: Group }) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const copy = t.scheduleRequests;
  const practitioner = user?.role === ROLE.PRACTITIONER;
  const clinicId = user?.clinic.id ?? '';
  const { connected } = useClinicRealtime(clinicId);
  const scope = `${clinicId || 'none'}:schedule-requests:${practitioner ? 'self' : doctorId || 'all'}`;
  const [view, setView] = useSessionStorageState(`${scope}:view`, { group: initialGroup as Group, kind: '', page: 1 });
  const [search, setSearch] = useSessionStorageState(`${scope}:search`, '');
  const [creating, setCreating] = useState(false);
  const [declining, setDeclining] = useState<ScheduleRequest | null>(null);
  const query = useScheduleRequests(clinicId, practitioner ? user?.clinicUserId : doctorId, view.group, view.page, connected);
  const mutation = useScheduleRequestMutation(clinicId);

  const term = search.trim().toLowerCase();
  const rows = (query.data?.items ?? []).filter(
    (row) =>
      (!view.kind || row.kind === view.kind) &&
      (!term || row.reason.toLowerCase().includes(term) || getStaffName(row.doctor, lang).toLowerCase().includes(term)),
  );
  const activeFilters = (view.group !== 'pending' ? 1 : 0) + (view.kind ? 1 : 0);
  const pageCount = query.data ? Math.ceil(query.data.total / query.data.pageSize) : 1;

  const review = (row: ScheduleRequest, decision: 'approved' | 'declined' | 'withdrawn', reviewNote?: string) =>
    mutation.mutate({ id: row.id, data: { decision, ...(reviewNote ? { reviewNote } : {}) } }, { onSuccess: () => setDeclining(null) });

  const statusBadge = (row: ScheduleRequest) => (
    <Badge variant={row.status === 'pending' ? 'warning' : row.status === 'approved' ? 'success' : 'muted'}>
      {copy.statuses[row.status]}
    </Badge>
  );
  const period = (row: ScheduleRequest) => (
    <div className="space-y-0.5 text-xs tabular-nums">
      <time dateTime={row.startAt} className="block">{formatDateTime(row.startAt, undefined, lang)}</time>
      <time dateTime={row.endAt} className="block text-muted-foreground">{formatDateTime(row.endAt, undefined, lang)}</time>
    </div>
  );
  const person = (row: ScheduleRequest) => (
    <div className="flex min-w-0 items-center gap-2">
      <PreviewableAvatar src={row.doctor.imageUrl} seed={row.doctorId} size="sm" />
      <TruncatedText className="font-medium">{getStaffName(row.doctor, lang)}</TruncatedText>
    </div>
  );
  const reasonText = (row: ScheduleRequest) => (
    <div className="space-y-0.5">
      <TruncatedText lines={2}>{row.reason}</TruncatedText>
      {row.reviewNote ? <TruncatedText lines={1} className="text-xs text-muted-foreground">{`${copy.reviewNote}: ${row.reviewNote}`}</TruncatedText> : null}
    </div>
  );
  const actions = (row: ScheduleRequest) =>
    row.status !== 'pending' ? null : (
      <div className="flex flex-wrap gap-1.5">
        {practitioner ? (
          <Button type="button" size="sm" variant="outline" disabled={mutation.isPending} onClick={() => review(row, 'withdrawn')}>
            {copy.withdraw}
          </Button>
        ) : (
          <>
            <Button type="button" size="sm" disabled={mutation.isPending} onClick={() => review(row, 'approved')}>
              {copy.approve}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={mutation.isPending} onClick={() => setDeclining(row)}>
              {copy.decline}
            </Button>
          </>
        )}
      </div>
    );

  const columns: DirectoryColumn<ScheduleRequest>[] = [
    ...(practitioner ? [] : [{ id: 'practitioner', className: 'w-[20%]', label: t.practitioner.practitioner, render: person }]),
    { id: 'kind', className: 'w-[12%]', label: copy.type, render: (row: ScheduleRequest) => <Badge variant="outline">{copy.kinds[row.kind]}</Badge> },
    { id: 'period', className: 'w-[18%]', label: copy.period, render: period },
    { id: 'reason', className: practitioner ? 'w-[34%]' : 'w-[22%]', label: copy.reason, render: reasonText },
    { id: 'status', className: 'w-[12%]', label: t.common.status, render: statusBadge },
    { id: 'actions', className: 'w-[16%]', label: '', render: actions },
  ];

  const body = query.isLoading ? (
    <TableSkeleton className="page-fill" rows={10} cols={columns.length} hasHeader={false} />
  ) : query.isError ? (
    <TableFrame className="page-fill"><ErrorState onRetry={() => void query.refetch()} /></TableFrame>
  ) : rows.length === 0 ? (
    <TableFrame className="page-fill">
      <EmptyState icon={IconCalendarClock} title={view.group === 'pending' ? copy.empty : copy.emptyHistory} />
    </TableFrame>
  ) : (
    <>
      <DirectoryTable rows={rows} columns={columns} rowKey={(row) => row.id} className="hidden md:flex" tableClassName="min-w-[46rem]" />
      <div className="page-fill overflow-y-auto overscroll-y-contain md:hidden">
        <div className="grid grid-cols-1 gap-3">
          {rows.map((row) => (
            <EntityMobileCard
              key={row.id}
              avatar={practitioner ? undefined : <PreviewableAvatar src={row.doctor.imageUrl} seed={row.doctorId} />}
              title={practitioner ? copy.kinds[row.kind] : getStaffName(row.doctor, lang)}
              subtitle={practitioner ? undefined : copy.kinds[row.kind]}
              tags={statusBadge(row)}
              meta={<div className="col-span-2 space-y-2">{period(row)}{reasonText(row)}</div>}
              footer={actions(row)}
            />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="page-fill min-h-0 gap-2.5">
      <SettingsPageBack
        search={<SearchInput value={search} onChange={setSearch} placeholder={copy.search} />}
        actions={
          <div className="flex items-center gap-1.5">
            <Popover>
              <FilterTrigger count={activeFilters} />
              <FilterPanel count={activeFilters} onClear={() => setView({ group: 'pending', kind: '', page: 1 })}>
                <FilterSelect label={t.common.status} value={view.group === 'history' ? 'history' : ''} placeholder={copy.statuses.pending} onChange={(value) => setView({ ...view, group: value === 'history' ? 'history' : 'pending', page: 1 })}>
                  <SelectItem value="history">{copy.history}</SelectItem>
                </FilterSelect>
                <FilterSelect label={copy.type} value={view.kind} onChange={(kind) => setView({ ...view, kind, page: 1 })}>
                  <SelectItem value="leave">{copy.kinds.leave}</SelectItem>
                  <SelectItem value="vacation">{copy.kinds.vacation}</SelectItem>
                  <SelectItem value="extra">{copy.kinds.extra}</SelectItem>
                </FilterSelect>
              </FilterPanel>
            </Popover>
            {practitioner ? (
              <Button type="button" size="sm" className={DIRECTORY_ACTION_CLASS} aria-label={copy.newRequest} onClick={() => setCreating(true)}>
                <IconAdd className="size-3.5 shrink-0" />
                <span className="hidden font-semibold sm:inline">{copy.newRequest}</span>
              </Button>
            ) : null}
          </div>
        }
      />
      {body}
      {query.data && pageCount > 1 ? (
        <Pagination resetScroll={false} page={view.page} totalItems={query.data.total} pageSize={query.data.pageSize} onPageChange={(page) => setView({ ...view, page })} />
      ) : null}
      {creating ? (
        <ScheduleRequestDialog
          pending={mutation.isPending}
          onClose={() => setCreating(false)}
          onSubmit={(input) => mutation.mutate(input, { onSuccess: () => { setCreating(false); setView({ ...view, group: 'pending', page: 1 }); } })}
        />
      ) : null}
      {declining ? (
        <DeclineRequestDialog pending={mutation.isPending} onClose={() => setDeclining(null)} onConfirm={(note) => review(declining, 'declined', note)} />
      ) : null}
    </div>
  );
}
