'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  APPOINTMENT_STATUS,
  INVOICE_STATUS,
  NOTE_STATUS,
  ROLE,
  SESSION_TYPE,
  VISIT_QUEUE,
  VISIT_REPORT_STATUS,
  type InvoiceStatus,
  type NoteStatus,
  type VisitQueue,
  type VisitReportStatus,
} from '@clinic/types';
import { Badge, Button, Card, CardContent, Popover, PopoverContent, PopoverTrigger, SelectItem, Skeleton } from '@/components/ui';
import {
  DatePicker,
  DirectoryToolbar,
  DIRECTORY_ACTION_CLASS,
  DIRECTORY_FILTER_BUTTON_CLASS,
  DIRECTORY_FILTER_BADGE_CLASS,
  EmptyState,
  EntityAvatar,
  ErrorState,
  FilterSelect,
  FormField,
  Pagination,
  SearchablePicker,
} from '@/components/primitives';
import { IconClinicalRecord, IconClose, IconFilters, IconInPerson, IconOnline } from '@/constants/icons';
import { StatusBadgeBlock } from '@/components/blocks/appointments/shared/status-badge';
import { ROUTES } from '@/constants/routes';
import { keepNestedPortals } from '@/lib/overlay';
import { cn } from '@/lib/utils';
import { getBilingualName } from '@/i18n';
import { formatDate, formatTime } from '@/lib/datetime';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { usePractitionerDirectory } from '@/hooks/api/use-practitioners';
import { useVisits } from '@/hooks/api/use-visits';
import { useAuth, useLanguage } from '@/providers';

const NOTE_FILTERS = Object.values(NOTE_STATUS);
const REPORT_FILTERS = Object.values(VISIT_REPORT_STATUS);
const INVOICE_FILTERS = Object.values(INVOICE_STATUS);
const QUEUE_FILTERS = Object.values(VISIT_QUEUE);

export function VisitsBoard({ initialNoteStatus, initialInvoiceStatus, initialReportStatus }: { initialNoteStatus?: NoteStatus; initialInvoiceStatus?: InvoiceStatus; initialReportStatus?: VisitReportStatus }) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const clinicId = useClinicId();
  const staffView = user?.role !== ROLE.PRACTITIONER;
  const [search, setSearch] = useState('');
  const [practitionerId, setPractitionerId] = useState('');
  const [appointmentStatus, setAppointmentStatus] = useState('');
  const [noteStatus, setNoteStatus] = useState(initialNoteStatus ?? '');
  const [reportStatus, setReportStatus] = useState(initialReportStatus ?? '');
  const [invoiceStatus, setInvoiceStatus] = useState(initialInvoiceStatus ?? '');
  const [queue, setQueue] = useState<VisitQueue | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const practitioners = usePractitionerDirectory({ clinicId });
  const query = {
    search: search || undefined,
    practitionerId: staffView && practitionerId ? practitionerId : undefined,
    appointmentStatus: appointmentStatus || undefined,
    noteStatus: (noteStatus || undefined) as NoteStatus | undefined,
    reportStatus: (reportStatus || undefined) as VisitReportStatus | undefined,
    invoiceStatus: (invoiceStatus || undefined) as InvoiceStatus | undefined,
    queue: queue || undefined,
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
    page,
    limit: 20,
  };
  const visits = useVisits(query, !!user);
  const resetPage = () => setPage(1);
  const activeCount =
    (queue ? 1 : 0) +
    (practitionerId ? 1 : 0) +
    (appointmentStatus ? 1 : 0) +
    (noteStatus ? 1 : 0) +
    (reportStatus ? 1 : 0) +
    (invoiceStatus ? 1 : 0) +
    (from ? 1 : 0) +
    (to ? 1 : 0);
  const resetFilters = () => {
    setQueue('');
    setPractitionerId('');
    setAppointmentStatus('');
    setNoteStatus('');
    setReportStatus('');
    setInvoiceStatus('');
    setFrom('');
    setTo('');
    resetPage();
  };

  return (
    <div className="page-fill gap-4">
      <DirectoryToolbar
        search={search}
        onSearchChange={(value) => { setSearch(value); resetPage(); }}
        searchPlaceholder={t.common.search}
        actions={
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={t.common.filters}
                className={cn(
                  DIRECTORY_ACTION_CLASS,
                  activeCount > 0 && DIRECTORY_FILTER_BUTTON_CLASS,
                  'border-border/70 bg-background/50',
                  activeCount > 0 && 'border-primary/35 bg-primary/5',
                )}
              >
                <IconFilters className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="hidden font-semibold sm:inline">{t.common.filters}</span>
                {activeCount > 0 ? (
                  <Badge variant="info" className={DIRECTORY_FILTER_BADGE_CLASS}>{activeCount}</Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 max-h-[min(32rem,calc(100dvh-var(--app-header-height)-2rem))] space-y-3 overflow-y-auto"
              onInteractOutside={keepNestedPortals}
              onFocusOutside={keepNestedPortals}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t.common.filters}</p>
                {activeCount > 0 ? (
                  <Button variant="ghost" size="xs" onClick={resetFilters}>
                    <IconClose className="size-3.5" />
                    {t.common.clear}
                  </Button>
                ) : null}
              </div>
              <FilterSelect label={t.visits.workQueue} value={queue} onChange={(value) => { setQueue(value as VisitQueue | ''); setAppointmentStatus(''); setNoteStatus(''); setReportStatus(''); setInvoiceStatus(''); resetPage(); }}>
                {QUEUE_FILTERS.map((item) => <SelectItem key={item} value={item}>{t.visits.queues[item]}</SelectItem>)}
              </FilterSelect>
              {staffView ? (
                <FormField label={t.visits.practitioners} labelClassName="text-xs">
                  <SearchablePicker
                    options={[
                      { value: '', label: t.visits.allPractitioners },
                      ...(practitioners.data ?? []).map((item) => ({ value: item.id, label: getBilingualName(item.name, item.nameAr, lang) })),
                    ]}
                    value={practitionerId}
                    onChange={(value) => { setPractitionerId(value); resetPage(); }}
                    placeholder={t.visits.allPractitioners}
                  />
                </FormField>
              ) : null}
              <FilterSelect label={t.visits.appointmentStatus} value={appointmentStatus} onChange={(value) => { setQueue(''); setAppointmentStatus(value); resetPage(); }}>
                {Object.values(APPOINTMENT_STATUS).map((status) => <SelectItem key={status} value={status}>{t.constants.status[status].label}</SelectItem>)}
              </FilterSelect>
              <FilterSelect label={t.visits.noteStatus} value={noteStatus} onChange={(value) => { setQueue(''); setNoteStatus(value); resetPage(); }}>
                {NOTE_FILTERS.map((status) => <SelectItem key={status} value={status}>{t.visits.noteStatuses[status]}</SelectItem>)}
              </FilterSelect>
              <FilterSelect label={t.visits.reportStatus} value={reportStatus} onChange={(value) => { setQueue(''); setReportStatus(value); resetPage(); }}>
                {REPORT_FILTERS.map((status) => <SelectItem key={status} value={status}>{t.visits.reportStatuses[status]}</SelectItem>)}
              </FilterSelect>
              <FilterSelect label={t.visits.invoiceStatus} value={invoiceStatus} onChange={(value) => { setQueue(''); setInvoiceStatus(value); resetPage(); }}>
                {INVOICE_FILTERS.map((status) => <SelectItem key={status} value={status}>{t.visits.invoiceStatuses[status]}</SelectItem>)}
              </FilterSelect>
              <FormField label={t.visits.from} labelClassName="text-xs">
                <DatePicker value={from} onChange={(value) => { setFrom(value); resetPage(); }} placeholder={t.visits.from} />
              </FormField>
              <FormField label={t.visits.to} labelClassName="text-xs">
                <DatePicker value={to} onChange={(value) => { setTo(value); resetPage(); }} placeholder={t.visits.to} />
              </FormField>
            </PopoverContent>
          </Popover>
        }
      />

      {visits.isError ? (
        <ErrorState onRetry={() => void visits.refetch()} className="page-fill" />
      ) : visits.isLoading ? (
        <div className="page-fill gap-4" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <Card key={index} className="shrink-0 gap-0 py-0">
              <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 sm:p-4 xl:grid-cols-[6rem_minmax(0,1fr)_minmax(24rem,1fr)]">
                <div className="order-2 flex min-h-12 flex-col items-center justify-center gap-1 border-s border-border/70 ps-3 xl:order-none xl:border-s-0 xl:border-e xl:ps-0 xl:pe-3"><Skeleton className="h-5 w-16 max-w-full" /><Skeleton className="h-4 w-8" /></div>
                <div className="order-1 min-w-0 space-y-1.5 xl:order-none"><div className="flex items-center gap-2"><Skeleton className="size-6 shrink-0 rounded-full" /><Skeleton className="h-5 w-36 max-w-full" /></div><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-16" /></div>
                <div className="order-3 col-span-2 grid grid-cols-3 gap-3 border-t border-border/60 pt-3 xl:col-span-1 xl:border-t-0 xl:border-s xl:ps-4 xl:pt-0">{[0, 1, 2].map((cell) => <div key={cell} className="flex min-w-0 flex-col items-center gap-1"><Skeleton className="h-4 w-14 max-w-full" /><Skeleton className="h-4 w-20 max-w-full" /></div>)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !visits.data?.items.length ? (
        <EmptyState icon={IconClinicalRecord} title={t.visits.empty} description={t.visits.emptyDesc} className="page-fill" />
      ) : (
        <div className="page-fill min-h-0 gap-3">
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {visits.data.items.map((item) => (
              <Link key={item.appointmentId} href={ROUTES.VISIT(item.appointmentId)} className="block rounded-xl focus-visible:outline focus-visible:outline-ring">
                <Card className="gap-0 py-0 transition-colors hover:bg-muted/40">
                  <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 sm:p-4 xl:grid-cols-[6rem_minmax(0,1fr)_minmax(24rem,1fr)]">
                    <div className="order-2 flex min-h-12 flex-col items-center justify-center gap-1 border-s border-border/70 ps-3 text-center xl:order-none xl:border-s-0 xl:border-e xl:ps-0 xl:pe-3">
                      <p className="whitespace-nowrap text-sm font-semibold tabular-nums">{formatTime(item.scheduledAt, undefined, lang)}</p>
                      <p className="whitespace-nowrap text-[11px] leading-4 text-muted-foreground">{t.visits.plannedDuration.replace('{minutes}', String(item.durationMins))}</p>
                    </div>
                    <div className="order-1 min-w-0 space-y-1.5 xl:order-none">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <div className="flex min-w-0 items-center gap-2"><EntityAvatar src={item.patient.imageUrl} seed={item.patient.id} size="sm" /><p className="truncate font-semibold">{getBilingualName(item.patient.name, item.patient.nameAr, lang)}</p></div>
                        <StatusBadgeBlock status={item.appointmentStatus} tip={false} />
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(item.scheduledAt, undefined, lang)} · {getBilingualName(item.practitioner.name, item.practitioner.nameAr, lang)}</p>
                      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">{item.mode === SESSION_TYPE.ONLINE ? <IconOnline className="size-3.5" /> : <IconInPerson className="size-3.5" />}{item.mode === SESSION_TYPE.ONLINE ? t.visits.online : t.visits.inPerson}</p>
                    </div>
                    <dl className="order-3 col-span-2 grid grid-cols-3 gap-3 border-t border-border/60 pt-3 text-center text-xs xl:col-span-1 xl:border-t-0 xl:border-s xl:ps-4 xl:pt-0">
                      <div className="min-w-0 space-y-1"><dt className="text-muted-foreground">{t.visits.note}</dt><dd className={cn('font-medium', item.noteStatus === NOTE_STATUS.LOCKED && 'text-warning')}>{t.visits.noteStatuses[item.noteStatus]}</dd></div>
                      <div className="min-w-0 space-y-1"><dt className="text-muted-foreground">{t.visits.report}</dt><dd className="font-medium">{t.visits.reportStatuses[item.reportStatus]}</dd></div>
                      <div className="min-w-0 space-y-1"><dt className="text-muted-foreground">{t.visits.invoice}</dt><dd className={cn('font-medium', item.invoiceStatus === INVOICE_STATUS.AWAITING_REVIEW && 'text-warning')}>{t.visits.invoiceStatuses[item.invoiceStatus]}</dd></div>
                    </dl>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination page={visits.data.page} pageCount={Math.ceil(visits.data.total / visits.data.limit)} totalItems={visits.data.total} pageSize={visits.data.limit} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
