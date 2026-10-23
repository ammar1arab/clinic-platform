'use client';

import { useState } from 'react';
import { INVOICE_STATUS, type InvoiceLineInput, type VisitWorkspace } from '@clinic/types';
import { Badge, Button, Input } from '@/components/ui';
import { EmptyState, FormField, ReasonDialog, SearchablePicker } from '@/components/primitives';
import { IconPayment } from '@/constants/icons';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { usePaymentMethods } from '@/hooks/api/use-payment-methods';
import { useCorrectInvoice, useDownloadVisitPdf, useInvoiceFeedback, useIssueInvoice, useRecordPayment, useReleaseDocument, useResolveInvoiceFeedback, useReversePayment, useSaveInvoice, useVoidInvoice } from '@/hooks/api/use-visits';
import { formatDateTime } from '@/lib/datetime';
import { formatClinicAmount } from '@/lib/package-balance';
import { useLanguage } from '@/providers';

export function InvoiceReview({ appointmentId, workspace }: { appointmentId: string; workspace: VisitWorkspace }) {
  const { t, lang } = useLanguage();
  const clinicId = useClinicId();
  const invoice = workspace.invoice;
  const methods = usePaymentMethods(clinicId, workspace.allowedActions.recordPayment || (invoice?.payments.length ?? 0) > 0);
  const save = useSaveInvoice(appointmentId);
  const issue = useIssueInvoice(appointmentId);
  const feedback = useInvoiceFeedback(appointmentId);
  const payment = useRecordPayment(appointmentId);
  const reversal = useReversePayment(appointmentId);
  const correct = useCorrectInvoice(appointmentId);
  const voidInvoice = useVoidInvoice(appointmentId);
  const resolve = useResolveInvoiceFeedback(appointmentId);
  const release = useReleaseDocument(appointmentId);
  const download = useDownloadVisitPdf();
  const [lines, setLines] = useState<InvoiceLineInput[]>(invoice?.lineItems ?? []);
  const [discount, setDiscount] = useState(invoice?.discount ?? '0');
  const [tax, setTax] = useState(invoice?.tax ?? '0');
  const [seenRevision, setSeenRevision] = useState(invoice?.revision ?? -1);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [reverseId, setReverseId] = useState<string | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<{ id: string; released: boolean } | null>(null);
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState('');
  const [reference, setReference] = useState('');

  if (invoice && seenRevision !== invoice.revision) {
    setSeenRevision(invoice.revision);
    setLines(invoice.lineItems);
    setDiscount(invoice.discount);
    setTax(invoice.tax);
  }

  if (!invoice) {
    return <EmptyState framed={false} icon={IconPayment} title={t.visits.invoice} description={t.visits.invoiceWaiting} />;
  }

  const editable = workspace.allowedActions.reviewInvoice || workspace.allowedActions.correctInvoice;
  const readOnly = !editable;
  const money = (value: string) => formatClinicAmount(value, invoice.currency);
  const isZero = (value: string) => Number(value) === 0;
  const methodName = (id: string | null) => methods.data?.find((method) => method.id === id)?.name ?? null;
  // Adjustments show only when they carry a value; the statement never repeats a figure.
  const statement = [
    { label: t.visits.subtotal, value: invoice.subtotal },
    { label: t.visits.discount, value: invoice.discount, optional: true },
    { label: t.visits.tax, value: invoice.tax, optional: true },
    { label: t.visits.packageCoverage, value: invoice.packageCoverage, optional: true },
    { label: t.visits.prepayment, value: invoice.prepayment, optional: true },
  ].filter((row) => !row.optional || !isZero(row.value));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 text-sm text-muted-foreground">
          {[invoice.number, invoice.issuedAt ? formatDateTime(invoice.issuedAt, undefined, lang) : null].filter(Boolean).join(' · ')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={invoice.status === INVOICE_STATUS.ISSUED ? 'success' : 'warning'}>{t.visits.invoiceStatuses[invoice.status]}</Badge>
          <Badge variant="muted">{t.visits.paymentStatuses[invoice.paymentStatus]}</Badge>
        </div>
      </div>
      {readOnly ? <p className="truncate text-sm text-muted-foreground">{t.visits.invoiceReadOnly}</p> : null}

      {editable ? (
        <div className="space-y-3">
          {lines.map((line, index) => (
            <div key={line.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_6rem_8rem]">
              <Input value={line.description} aria-label={t.visits.lineDescription} onChange={(event) => setLines(lines.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} />
              <Input value={line.quantity} inputMode="decimal" aria-label={t.visits.quantity} onChange={(event) => setLines(lines.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: event.target.value } : item))} />
              <Input value={line.unitPrice} inputMode="decimal" aria-label={t.visits.unitPrice} onChange={(event) => setLines(lines.map((item, itemIndex) => itemIndex === index ? { ...item, unitPrice: event.target.value } : item))} />
            </div>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label={t.visits.discount} htmlFor="invoice-discount"><Input id="invoice-discount" value={discount} inputMode="decimal" onChange={(event) => setDiscount(event.target.value)} /></FormField>
            <FormField label={t.visits.tax} htmlFor="invoice-tax"><Input id="invoice-tax" value={tax} inputMode="decimal" onChange={(event) => setTax(event.target.value)} /></FormField>
          </div>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border text-sm">
          {invoice.lineItems.map((line) => (
            <li key={line.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-medium">{line.description}</p>
                <p className="text-xs tabular-nums text-muted-foreground">{line.quantity} × {money(line.unitPrice)}</p>
              </div>
              <span className="shrink-0 tabular-nums">{money(line.total)}</span>
            </li>
          ))}
        </ul>
      )}

      <dl className="divide-y rounded-xl border text-sm tabular-nums">
        {statement.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd>{money(row.value)}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 px-3 py-2 font-semibold">
          <dt>{t.visits.total}</dt>
          <dd>{money(invoice.total)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <dt className="text-muted-foreground">{t.visits.paid}</dt>
          <dd>{money(invoice.paid)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2 font-semibold">
          <dt>{t.visits.balance}</dt>
          <dd>{money(invoice.balance)}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        {editable && workspace.visitId ? (
          <Button type="button" variant="outline" disabled={save.isPending} onClick={() => save.mutate({ visitId: workspace.visitId!, body: { lineItems: lines, discount, tax, revision: invoice.revision } })}>{t.common.save}</Button>
        ) : null}
        {workspace.allowedActions.issueInvoice && workspace.visitId ? (
          <Button type="button" disabled={issue.isPending} onClick={() => issue.mutate({ visitId: workspace.visitId!, revision: invoice.revision })}>{t.visits.issue}</Button>
        ) : null}
        {workspace.allowedActions.flagDiscrepancy ? (
          <Button type="button" variant="outline" onClick={() => setFeedbackOpen(true)}>{t.visits.flagDiscrepancy}</Button>
        ) : null}
        {workspace.allowedActions.recordPayment ? (
          <Button type="button" variant="outline" onClick={() => setPayOpen(true)}>{t.visits.payment}</Button>
        ) : null}
        {workspace.allowedActions.correctInvoice && workspace.visitId ? (
          <Button type="button" variant="outline" onClick={() => setCorrectOpen(true)}>{t.visits.correctInvoice}</Button>
        ) : null}
        {workspace.allowedActions.voidInvoice && workspace.visitId ? (
          <Button type="button" variant="outline" onClick={() => setVoidOpen(true)}>{t.visits.voidInvoice}</Button>
        ) : null}
        {invoice.pdfAvailable && workspace.visitId ? (
          <Button type="button" variant="outline" disabled={download.isPending} onClick={() => download.mutate({ kind: 'invoice', visitId: workspace.visitId! })}>{t.visits.downloadPdf}</Button>
        ) : null}
      </div>

      {invoice.payments.length > 0 ? (
        <ul className="divide-y rounded-xl border text-sm">
          {invoice.payments.map((item) => {
            const reversed = item.amount.startsWith('-');
            const details = [formatDateTime(item.createdAt, undefined, lang), methodName(item.methodId), item.reference, item.reason]
              .filter(Boolean)
              .join(' · ');
            return (
              <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="tabular-nums">{money(item.amount)}</p>
                  <p className="truncate text-xs text-muted-foreground">{details}</p>
                </div>
                {workspace.allowedActions.reversePayment && !reversed ? <Button type="button" size="sm" variant="ghost" onClick={() => setReverseId(item.id)}>{t.visits.reverse}</Button> : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {invoice.versions.length > 0 ? (
        <ul className="divide-y rounded-xl border text-sm">
          {invoice.versions.map((version) => (
            <li key={version.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span>{t.visits.version} {version.revision}</span>
              <span className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => workspace.visitId && download.mutate({ kind: 'invoice', visitId: workspace.visitId, revision: version.revision })}>{t.visits.downloadPdf}</Button>
                {workspace.allowedActions.releaseDocument ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setReleaseTarget({ id: version.id, released: !version.releasedAt })}>{version.releasedAt ? t.visits.withdrawRelease : t.visits.releaseDocument}</Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {invoice.feedback.length > 0 ? (
        <ul className="divide-y rounded-xl border text-sm">
          {invoice.feedback.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="min-w-0">{item.message}</span>
              {workspace.allowedActions.resolveInvoiceFeedback && !item.resolvedAt && workspace.visitId ? (
                <Button type="button" size="sm" variant="ghost" onClick={() => setResolveId(item.id)}>{t.visits.resolveFeedback}</Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <ReasonDialog open={feedbackOpen} title={t.visits.flagDiscrepancy} pending={feedback.isPending} onOpenChange={setFeedbackOpen} onSubmit={(message) => workspace.visitId && feedback.mutate({ visitId: workspace.visitId, message }, { onSuccess: () => setFeedbackOpen(false) })} />
      <ReasonDialog open={!!resolveId} title={t.visits.resolveFeedback} pending={resolve.isPending} onOpenChange={(open) => { if (!open) setResolveId(null); }} onSubmit={(reason) => workspace.visitId && resolveId && resolve.mutate({ visitId: workspace.visitId, feedbackId: resolveId, reason }, { onSuccess: () => setResolveId(null) })} />
      <ReasonDialog open={correctOpen} title={t.visits.correctInvoice} pending={correct.isPending} onOpenChange={setCorrectOpen} onSubmit={(reason) => workspace.visitId && correct.mutate({ visitId: workspace.visitId, body: { lineItems: lines, discount, tax, revision: invoice.revision, reason } }, { onSuccess: () => setCorrectOpen(false) })} />
      <ReasonDialog open={voidOpen} title={t.visits.voidInvoice} pending={voidInvoice.isPending} onOpenChange={setVoidOpen} onSubmit={(reason) => workspace.visitId && voidInvoice.mutate({ visitId: workspace.visitId, revision: invoice.revision, reason }, { onSuccess: () => setVoidOpen(false) })} />
      <ReasonDialog open={!!releaseTarget} title={t.visits.releaseDocument} pending={release.isPending} onOpenChange={(open) => { if (!open) setReleaseTarget(null); }} onSubmit={(reason) => releaseTarget && release.mutate({ documentId: releaseTarget.id, released: releaseTarget.released, reason }, { onSuccess: () => setReleaseTarget(null) })} />
      {payOpen ? (
        <div className="space-y-3 rounded-xl border border-border p-3">
          <FormField label={t.visits.amount} htmlFor="pay-amount"><Input id="pay-amount" value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value)} /></FormField>
          <FormField label={t.visits.method}>
            <SearchablePicker options={(methods.data ?? []).map((method) => ({ value: method.id, label: method.name }))} value={methodId} onChange={setMethodId} placeholder={t.visits.method} />
          </FormField>
          <FormField label={t.visits.reference} htmlFor="pay-ref"><Input id="pay-ref" value={reference} onChange={(event) => setReference(event.target.value)} /></FormField>
          <Button type="button" disabled={payment.isPending || !methodId || !amount} onClick={() => payment.mutate({ invoiceId: invoice.id, body: { amount, methodId, requestId: crypto.randomUUID(), expectedRevision: invoice.revision, reference: reference || undefined } }, { onSuccess: () => setPayOpen(false) })}>{t.visits.payment}</Button>
        </div>
      ) : null}
      <ReasonDialog
        open={!!reverseId}
        title={t.visits.reverse}
        pending={reversal.isPending}
        onOpenChange={(open) => { if (!open) setReverseId(null); }}
        onSubmit={(reason) => {
          if (!reverseId) return;
          reversal.mutate({ invoiceId: invoice.id, body: { paymentId: reverseId, amount: invoice.payments.find((item) => item.id === reverseId)?.amount ?? '0', reason, requestId: crypto.randomUUID(), expectedRevision: invoice.revision } }, { onSuccess: () => setReverseId(null) });
        }}
      />
    </div>
  );
}
