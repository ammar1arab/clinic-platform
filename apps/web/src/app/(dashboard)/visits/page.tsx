'use client';

import { useSearchParams } from 'next/navigation';
import { INVOICE_STATUS, isValueOf, NOTE_STATUS, VISIT_REPORT_STATUS } from '@clinic/types';
import { VisitsBoard } from '@/components/blocks/visits/visits-board';

export default function VisitsPage() {
  const params = useSearchParams();
  const note = params.get('noteStatus');
  const report = params.get('reportStatus');
  const invoice = params.get('invoiceStatus');
  return (
    <VisitsBoard
      initialNoteStatus={isValueOf(NOTE_STATUS, note) ? note : undefined}
      initialReportStatus={isValueOf(VISIT_REPORT_STATUS, report) ? report : undefined}
      initialInvoiceStatus={isValueOf(INVOICE_STATUS, invoice) ? invoice : undefined}
    />
  );
}
