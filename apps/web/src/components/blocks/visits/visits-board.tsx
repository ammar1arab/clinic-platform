'use client';

import Link from 'next/link';
import { useState } from 'react';
import { APPOINTMENT_STATUS, INVOICE_STATUS, NOTE_STATUS, ROLE, SESSION_TYPE, VISIT_QUEUE, VISIT_REPORT_STATUS, type InvoiceStatus, type NoteStatus, type VisitQueue, type VisitReportStatus } from '@clinic/types';
import { Badge, Button, Card, CardContent, SelectItem, Skeleton } from '@/components/ui';
import { EmptyState, ErrorState, FilterSelect, Pagination, SearchInput, SearchablePicker } from '@/components/primitives';
import { IconVisit } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { getBilingualName } from '@/i18n';
import { formatDateTime } from '@/lib/datetime';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { usePractitionerDirectory } from '@/hooks/api/use-practitioners';
import { useVisits } from '@/hooks/api/use-visits';
import { useAuth, useLanguage } from '@/providers';

const NOTE_FILTERS = Object.values(NOTE_STATUS);
const REPORT_FILTERS = Object.values(VISIT_REPORT_STATUS);
const INVOICE_FILTERS = Object.values(INVOICE_STATUS);

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
  const applyQueue = (next: VisitQueue) => {
    setQueue(next);
    setNoteStatus('');
    setReportStatus('');
    setInvoiceStatus('');
    setAppointmentStatus('');
    setPage(1);
  };
  const shortcuts: { label: string; queue: VisitQueue }[] = [
    { label: t.visits.lateDocumentation, queue: VISIT_QUEUE.LOCKED },
    { label: t.visits.invoiceNeedsReview, queue: VISIT_QUEUE.INVOICE_REVIEW },
    { label: t.visits.inProgress, queue: VISIT_QUEUE.IN_PROGRESS },
    { label: t.visits.awaitingDocumentation, queue: VISIT_QUEUE.DOCUMENTATION_PENDING },
  ];

  return (
    <div className="page-fill gap-4">
      <div className="shrink-0 space-y-3">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {shortcuts.map((item) => (
            <Button key={item.queue} type="button" variant={queue === item.queue ? 'default' : 'outline'} className="h-auto justify-start px-3 py-3 text-start" onClick={() => applyQueue(item.queue)}>{item.label}</Button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder={t.common.search} />
          {staffView ? (
            <SearchablePicker
              options={[
                { value: '', label: t.visits.allPractitioners },
                ...(practitioners.data ?? []).map((item) => ({ value: item.id, label: getBilingualName(item.name, item.nameAr, lang) })),
              ]}
              value={practitionerId}
              onChange={(value) => { setPractitionerId(value); setPage(1); }}
              placeholder={t.visits.allPractitioners}
            />
          ) : null}
          <FilterSelect label={t.visits.appointmentStatus} value={appointmentStatus} onChange={(value) => { setQueue(''); setAppointmentStatus(value); setPage(1); }}>
            {Object.values(APPOINTMENT_STATUS).map((status) => <SelectItem key={status} value={status}>{t.constants.status[status].label}</SelectItem>)}
          </FilterSelect>
          <FilterSelect label={t.visits.noteStatus} value={noteStatus} onChange={(value) => { setQueue(''); setNoteStatus(value); setPage(1); }}>
            {NOTE_FILTERS.map((status) => <SelectItem key={status} value={status}>{t.visits.noteStatuses[status]}</SelectItem>)}
          </FilterSelect>
          <FilterSelect label={t.visits.reportStatus} value={reportStatus} onChange={(value) => { setQueue(''); setReportStatus(value); setPage(1); }}>
            {REPORT_FILTERS.map((status) => <SelectItem key={status} value={status}>{t.visits.reportStatuses[status]}</SelectItem>)}
          </FilterSelect>
          <FilterSelect label={t.visits.invoiceStatus} value={invoiceStatus} onChange={(value) => { setQueue(''); setInvoiceStatus(value); setPage(1); }}>
            {INVOICE_FILTERS.map((status) => <SelectItem key={status} value={status}>{t.visits.invoiceStatuses[status]}</SelectItem>)}
          </FilterSelect>
          <label className="space-y-1.5 text-xs">
            <span className="text-muted-foreground">{t.visits.from}</span>
            <input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="h-8 w-full rounded-lg border border-input bg-transparent px-2" />
          </label>
          <label className="space-y-1.5 text-xs">
            <span className="text-muted-foreground">{t.visits.to}</span>
            <input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="h-8 w-full rounded-lg border border-input bg-transparent px-2" />
          </label>
        </div>
      </div>
      {visits.isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-24 w-full rounded-xl" />)}</div>
      ) : visits.isError ? (
        <ErrorState onRetry={() => void visits.refetch()} className="page-fill" />
      ) : !visits.data?.items.length ? (
        <EmptyState icon={IconVisit} title={t.visits.empty} description={t.visits.emptyDesc} className="page-fill" />
      ) : (
        <div className="page-fill min-h-0 gap-3">
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {visits.data.items.map((item) => (
              <Link key={item.appointmentId} href={ROUTES.VISIT(item.appointmentId)} className="block rounded-xl focus-visible:outline focus-visible:outline-ring">
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{getBilingualName(item.patient.name, item.patient.nameAr, lang)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(item.scheduledAt, undefined, lang)} · {getBilingualName(item.practitioner.name, item.practitioner.nameAr, lang)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="muted">{item.mode === SESSION_TYPE.ONLINE ? t.visits.online : t.visits.inPerson}</Badge>
                      <Badge variant="info">{t.visits.noteStatuses[item.noteStatus]}</Badge>
                      <Badge variant="muted">{t.visits.reportStatuses[item.reportStatus]}</Badge>
                      <Badge variant="muted">{t.visits.invoiceStatuses[item.invoiceStatus]}</Badge>
                    </div>
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
