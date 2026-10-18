'use client';

import { useState } from 'react';
import { NOTE_STATUS, REPORT_SECTION, VISIT_REPORT_STATUS, type ReportSectionKey, type ReportSections, type VisitWorkspace } from '@clinic/types';
import { Badge, Button, Textarea } from '@/components/ui';
import { EmptyState, FormField, ReasonDialog } from '@/components/primitives';
import { IconFileText } from '@/constants/icons';
import { useAmendReport, useDownloadVisitPdf, useReleaseDocument, useSaveReport, useSignReport } from '@/hooks/api/use-visits';
import { useLanguage } from '@/providers';

export function MedicalReportEditor({ appointmentId, workspace }: { appointmentId: string; workspace: VisitWorkspace }) {
  const { t } = useLanguage();
  const report = workspace.report;
  const save = useSaveReport(appointmentId);
  const sign = useSignReport(appointmentId);
  const amend = useAmendReport(appointmentId);
  const release = useReleaseDocument(appointmentId);
  const download = useDownloadVisitPdf();
  const [amendOpen, setAmendOpen] = useState(false);
  const [releaseTarget, setReleaseTarget] = useState<{ id: string; released: boolean } | null>(null);
  const [draft, setDraft] = useState<ReportSections | null>(report?.sections ?? null);
  const [seenRevision, setSeenRevision] = useState(report?.revision ?? -1);
  if (report && seenRevision !== report.revision) {
    setSeenRevision(report.revision);
    setDraft(report.sections);
  }

  if (!report || (workspace.noteStatus !== NOTE_STATUS.SIGNED && workspace.reportStatus === VISIT_REPORT_STATUS.PENDING_NOTE)) {
    return <EmptyState icon={IconFileText} title={t.visits.reportPending} description={t.visits.reportPendingDesc} />;
  }
  if (!report || !draft) {
    return <EmptyState icon={IconFileText} title={t.visits.reportPending} description={t.visits.reportPendingDesc} />;
  }

  const labels: Record<ReportSectionKey, string> = {
    [REPORT_SECTION.REASON]: t.visits.reportReason,
    [REPORT_SECTION.SUMMARY]: t.visits.reportSummary,
    [REPORT_SECTION.ASSESSMENT]: t.visits.reportAssessment,
    [REPORT_SECTION.PLAN]: t.visits.reportPlan,
    [REPORT_SECTION.FOLLOW_UP]: t.visits.reportFollowUp,
  };
  const editable = workspace.allowedActions.editReport;
  const signed = report.status === VISIT_REPORT_STATUS.SIGNED;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={signed ? 'success' : 'warning'}>{t.visits.reportStatuses[report.status]}</Badge>
        {signed ? <span className="text-xs text-muted-foreground">{t.visits.signedImmutable}</span> : null}
      </div>
      {Object.values(REPORT_SECTION).map((key) => (
        <FormField key={key} label={labels[key]} htmlFor={`report-${key}`}>
          <Textarea
            id={`report-${key}`}
            rows={key === REPORT_SECTION.SUMMARY || key === REPORT_SECTION.ASSESSMENT ? 6 : 4}
            className="min-h-28 text-base leading-relaxed"
            disabled={!editable}
            value={draft[key]}
            onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
          />
        </FormField>
      ))}
      <div className="flex flex-wrap gap-2">
        {editable ? (
          <Button type="button" variant="outline" disabled={save.isPending || !workspace.visitId} onClick={() => workspace.visitId && save.mutate({ visitId: workspace.visitId, body: { sections: draft, revision: report.revision } })}>
            {t.common.save}
          </Button>
        ) : null}
        {workspace.allowedActions.signReport && workspace.visitId ? (
          <Button type="button" disabled={sign.isPending || save.isPending} onClick={() => save.mutate({ visitId: workspace.visitId!, body: { sections: draft, revision: report.revision } }, { onSuccess: (next) => sign.mutate({ visitId: workspace.visitId!, revision: next.report?.revision ?? report.revision }) })}>{t.visits.signReport}</Button>
        ) : null}
        {workspace.allowedActions.amendReport ? (
          <Button type="button" variant="outline" onClick={() => setAmendOpen(true)}>{t.visits.amend}</Button>
        ) : null}
        {report.pdfAvailable && workspace.visitId ? (
          <Button type="button" variant="outline" disabled={download.isPending} onClick={() => download.mutate({ kind: 'report', visitId: workspace.visitId! })}>{t.visits.downloadPdf}</Button>
        ) : null}
      </div>
      {report.versions.length > 0 ? (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {report.versions.map((version) => (
            <li key={version.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>{t.visits.version.replace('{version}', String(version.revision))}</span>
              <span className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => workspace.visitId && download.mutate({ kind: 'report', visitId: workspace.visitId, revision: version.revision })}>{t.visits.downloadPdf}</Button>
                {workspace.allowedActions.releaseDocument ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setReleaseTarget({ id: version.id, released: !version.releasedAt })}>{version.releasedAt ? t.visits.withdrawRelease : t.visits.releaseDocument}</Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <ReasonDialog open={!!releaseTarget} title={t.visits.releaseDocument} pending={release.isPending} onOpenChange={(open) => { if (!open) setReleaseTarget(null); }} onSubmit={(reason) => releaseTarget && release.mutate({ documentId: releaseTarget.id, released: releaseTarget.released, reason }, { onSuccess: () => setReleaseTarget(null) })} />
      <ReasonDialog
        open={amendOpen}
        title={t.visits.amend}
        pending={amend.isPending}
        onOpenChange={setAmendOpen}
        onSubmit={(reason) => {
          if (!workspace.visitId) return;
          amend.mutate({ visitId: workspace.visitId, body: { sections: draft, revision: report.revision, reason } }, { onSuccess: () => setAmendOpen(false) });
        }}
      />
    </div>
  );
}
