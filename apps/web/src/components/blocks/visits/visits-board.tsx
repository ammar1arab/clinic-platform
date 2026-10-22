'use client';

import { DEFAULT_PAGE_SIZE } from '@/components/primitives/display/pagination';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSessionStorageState } from '@/hooks/shared/use-session-storage-state';
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
  type VisitSummary,
} from '@clinic/types';
import { Badge, Card, CardContent, Popover, SelectItem, Skeleton } from '@/components/ui';
import {
  DatePicker,
  DirectoryToolbar,
  FilterPanel,
  FilterTrigger,
  EmptyState,
  EntityMobileCard,
  PreviewableAvatar,
  ErrorState,
  FilterSelect,
  FormField,
  Pagination,
  SearchablePicker,
} from '@/components/primitives';
import { IconClinicalRecord, IconInPerson, IconOnline } from '@/constants/icons';
import { StatusBadgeBlock } from '@/components/blocks/appointments/shared/status-badge';
import { ROUTES } from '@/constants/routes';
import { HIGHLIGHT_SURFACE_CLASS } from '@/constants/status';
import { cn } from '@/lib/utils';
import { getBilingualName } from '@/i18n';
import { formatDate, formatTime } from '@/lib/datetime';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { usePractitionerDirectory } from '@/hooks/api/use-practitioners';
import { usePrefetchVisitWorkspace, useVisits } from '@/hooks/api/use-visits';
import { useDownloadVisitsReport } from '@/hooks/api/use-reports';
import { ExportFormatButton } from '@/components/blocks/reports';
import { useAuth, useLanguage } from '@/providers';

const NOTE_FILTERS = Object.values(NOTE_STATUS);
const REPORT_FILTERS = Object.values(VISIT_REPORT_STATUS);
const INVOICE_FILTERS = Object.values(INVOICE_STATUS);
const QUEUE_FILTERS = Object.values(VISIT_QUEUE);

export function VisitsBoard({ initialNoteStatus, initialInvoiceStatus, initialReportStatus }: { initialNoteStatus?: NoteStatus; initialInvoiceStatus?: InvoiceStatus; initialReportStatus?: VisitReportStatus }) {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const { user } = useAuth();
  const clinicId = useClinicId();
  const prefetchWorkspace = usePrefetchVisitWorkspace();
  const staffView = user?.role !== ROLE.PRACTITIONER;
  const scope = clinicId || 'none';
  const [search, setSearch] = useSessionStorageState(`${scope}:visits-search`, '');
  const [practitionerId, setPractitionerId] = useSessionStorageState(`${scope}:visits-practitioner`, '');
  const [appointmentStatus, setAppointmentStatus] = useSessionStorageState(`${scope}:visits-appointment-status`, '');
  const [noteStatus, setNoteStatus] = useSessionStorageState(`${scope}:visits-note-status`, initialNoteStatus ?? '');
  const [reportStatus, setReportStatus] = useSessionStorageState(`${scope}:visits-report-status`, initialReportStatus ?? '');
  const [invoiceStatus, setInvoiceStatus] = useSessionStorageState(`${scope}:visits-invoice-status`, initialInvoiceStatus ?? '');
  const [queue, setQueue] = useSessionStorageState<VisitQueue | ''>(`${scope}:visits-queue`, '');
  const [from, setFrom] = useSessionStorageState(`${scope}:visits-from`, '');
  const [to, setTo] = useSessionStorageState(`${scope}:visits-to`, '');
  const [page, setPage] = useSessionStorageState(`${scope}:visits-page`, 1);
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
    limit: DEFAULT_PAGE_SIZE,
  };
  const visits = useVisits(query, !!user);
  const downloadVisits = useDownloadVisitsReport(clinicId);
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
    <div className="page-fill gap-2.5">
      <DirectoryToolbar
        search={search}
        onSearchChange={(value) => { setSearch(value); resetPage(); }}
        searchPlaceholder={t.common.search}
        actions={
          <div className="flex items-center gap-1.5">
            <ExportFormatButton
              compact
              disabled={downloadVisits.isPending || visits.isLoading || !visits.data?.total}
              pending={downloadVisits.isPending}
              onSelect={(format) => downloadVisits.mutate({
                format,
                from: query.from,
                to: query.to,
                practitionerId: staffView ? practitionerId || undefined : undefined,
                appointmentStatus: appointmentStatus || undefined,
                noteStatus: noteStatus || undefined,
                reportStatus: reportStatus || undefined,
                invoiceStatus: invoiceStatus || undefined,
                queue: queue || undefined,
                search: search || undefined,
              })}
            />
            <Popover>
              <FilterTrigger count={activeCount} />
              <FilterPanel count={activeCount} onClear={resetFilters}>
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
              <div className="grid grid-cols-2 gap-3">
                <FormField label={t.visits.from} labelClassName="text-xs">
                  <DatePicker value={from} onChange={(value) => { setFrom(value); resetPage(); }} placeholder={t.visits.from} />
                </FormField>
                <FormField label={t.visits.to} labelClassName="text-xs">
                  <DatePicker value={to} onChange={(value) => { setTo(value); resetPage(); }} placeholder={t.visits.to} />
                </FormField>
              </div>
              </FilterPanel>
            </Popover>
          </div>
        }
      />

      {visits.isError ? (
        <ErrorState onRetry={() => void visits.refetch()} className="page-fill" />
      ) : visits.isLoading ? (
        <div className="page-fill gap-6 overflow-hidden" aria-busy="true">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="visit-chain relative">
              <EntityMobileCard className="lg:hidden" title={<Skeleton className="h-5 w-32" />} avatar={<Skeleton className="size-6 rounded-full" />} subtitle={<div className="space-y-1.5"><Skeleton className="h-4 w-36 max-w-full" /><div className="flex items-center gap-1.5"><Skeleton className="size-6 shrink-0 rounded-full" /><Skeleton className="h-4 w-24 max-w-full" /></div></div>} actions={<div className="flex flex-col items-end gap-1"><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-5 w-28 rounded-full" /></div>} footer={<><div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-4">{[0, 1, 2, 3].map((cell) => <div key={cell} className="space-y-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-20" /></div>)}</div></>} />
            <Card className="hidden shrink-0 gap-0 py-0 lg:flex">
              <CardContent className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3 p-3 sm:p-4 xl:grid-cols-[6rem_minmax(0,1fr)_minmax(24rem,1fr)]">
                <div className="flex min-h-12 flex-col items-center justify-center gap-1 border-e border-border/70 pe-3"><Skeleton className="h-5 w-16 max-w-full" /><Skeleton className="h-4 w-8" /></div>
                <div className="space-y-1.5"><Skeleton className="h-5 w-36 max-w-full" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-16" /></div>
                <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border/60 pt-3 sm:grid-cols-4 xl:col-span-1 xl:border-t-0 xl:border-s xl:ps-4 xl:pt-0">{[0, 1, 2, 3].map((cell) => <div key={cell} className="space-y-1"><Skeleton className="h-4 w-14 max-w-full" /><Skeleton className="h-4 w-20 max-w-full" /></div>)}</div>
              </CardContent>
            </Card>
            </div>
          ))}
        </div>
      ) : !visits.data?.items.length ? (
        <EmptyState icon={IconClinicalRecord} title={t.visits.empty} description={t.visits.emptyDesc} className="page-fill" />
      ) : (
        <div className="page-fill min-h-0 gap-3">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto">
            {visits.data.items.map((item) => (
              <div key={item.appointmentId} className="visit-chain relative">
                <EntityMobileCard className={cn('lg:hidden', item.appointmentStatus === APPOINTMENT_STATUS.IN_PROGRESS && HIGHLIGHT_SURFACE_CLASS)}
                  title={getBilingualName(item.patient.name, item.patient.nameAr, lang)}
                  avatar={<span onClick={(event) => event.stopPropagation()}><PreviewableAvatar src={item.patient.imageUrl} seed={item.patient.id} size="sm" /></span>}
                  subtitle={<div className="space-y-1.5 whitespace-normal">
                    <p>{formatDate(item.scheduledAt, undefined, lang)}</p>
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span onClick={(event) => event.stopPropagation()}><PreviewableAvatar src={item.practitioner.imageUrl} seed={item.practitioner.id} size="sm" /></span>
                      <span className="min-w-0 break-words">{getBilingualName(item.practitioner.name, item.practitioner.nameAr, lang)}</span>
                    </div>
                  </div>}
                  actions={<div className="flex max-w-36 flex-col items-end gap-1">
                    <span className="whitespace-nowrap text-xs font-semibold tabular-nums">{formatTime(item.scheduledAt, undefined, lang)}</span>
                    <StatusBadgeBlock status={item.appointmentStatus} tip={false} />
                    <Badge variant="muted">{item.mode === SESSION_TYPE.ONLINE ? t.visits.online : t.visits.inPerson}{item.room ? ` · ${getBilingualName(item.room.name, item.room.nameAr, lang)}` : ''}</Badge>
                  </div>}
                  footer={<>
                    <VisitCardMeta item={item} className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-xs sm:grid-cols-4" />
                  </>}
                  onClick={() => router.push(ROUTES.VISIT(item.appointmentId))}
                  onMouseEnter={() => prefetchWorkspace(item.appointmentId)} onFocus={() => prefetchWorkspace(item.appointmentId)}
                />
              <Card aura={item.appointmentStatus !== APPOINTMENT_STATUS.IN_PROGRESS} className={cn(
                'relative hidden gap-0 py-0 transition-colors hover:bg-muted/40 lg:flex',
                item.appointmentStatus === APPOINTMENT_STATUS.IN_PROGRESS && [HIGHLIGHT_SURFACE_CLASS, 'ring-0'],
              )}>
                <Link href={ROUTES.VISIT(item.appointmentId)} onMouseEnter={() => prefetchWorkspace(item.appointmentId)} onFocus={() => prefetchWorkspace(item.appointmentId)} aria-label={getBilingualName(item.patient.name, item.patient.nameAr, lang)} className="absolute inset-0 z-10 rounded-xl focus-visible:outline focus-visible:outline-ring" />
                <CardContent className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-3 gap-y-3 p-3 xl:grid-cols-[6rem_minmax(0,1fr)_minmax(24rem,1fr)] sm:p-4">
                  <div className="flex min-h-12 flex-col items-center justify-center gap-1 border-e border-border/70 pe-3 text-center">
                    <p className="whitespace-nowrap text-sm font-semibold tabular-nums">{formatTime(item.scheduledAt, undefined, lang)}</p>
                    <p className="whitespace-nowrap text-2xs leading-4 text-muted-foreground">{t.visits.plannedDuration.replace('{minutes}', String(item.durationMins))}</p>
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="flex min-w-0 items-center gap-2"><span className="relative z-20 inline-flex"><PreviewableAvatar src={item.patient.imageUrl} seed={item.patient.id} size="sm" /></span><p className="truncate font-semibold">{getBilingualName(item.patient.name, item.patient.nameAr, lang)}</p></div>
                      <StatusBadgeBlock status={item.appointmentStatus} tip={false} />
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(item.scheduledAt, undefined, lang)} · {getBilingualName(item.practitioner.name, item.practitioner.nameAr, lang)}</p>
                    <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">{item.mode === SESSION_TYPE.ONLINE ? <IconOnline className="size-3.5" /> : <IconInPerson className="size-3.5" />}{item.mode === SESSION_TYPE.ONLINE ? t.visits.online : t.visits.inPerson}{item.room ? ` · ${getBilingualName(item.room.name, item.room.nameAr, lang)}` : ''}</p>
                  </div>
                  <VisitCardMeta item={item} className="col-span-2 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-border/60 pt-3 text-xs sm:grid-cols-4 xl:col-span-1 xl:border-t-0 xl:pt-0" />
                </CardContent>
              </Card>
              </div>
            ))}
          </div>
          <Pagination page={visits.data.page} totalItems={visits.data.total} pageSize={visits.data.limit} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

function VisitCardMeta({ item, className }: { item: VisitSummary; className: string }) {
  const { t, lang } = useLanguage();
  const details = [
    { label: t.entities.service, value: item.service ? getBilingualName(item.service.name, item.service.nameAr, lang) : t.appointments.generalVisit },
    { label: t.visits.note, value: t.visits.noteStatuses[item.noteStatus], warning: item.noteStatus === NOTE_STATUS.LOCKED },
    { label: t.visits.report, value: t.visits.reportStatuses[item.reportStatus] },
    { label: t.visits.invoice, value: t.visits.invoiceStatuses[item.invoiceStatus], warning: item.invoiceStatus === INVOICE_STATUS.AWAITING_REVIEW },
  ];
  return <dl className={className}>{details.map((detail) => (
    <div key={detail.label} className="min-w-0 space-y-1 px-1 text-center"><dt className="text-muted-foreground">{detail.label}</dt><dd className={cn('break-words font-medium', detail.warning && 'text-warning')}>{detail.value}</dd></div>
  ))}</dl>;
}
