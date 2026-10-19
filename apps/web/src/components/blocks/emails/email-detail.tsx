"use client";

import { useState } from "react";
import type { EmailRecipientDelivery } from "@clinic/types";
import { Badge, Button } from "@/components/ui";
import {
  EmptyState,
  DirectoryMeta,
  EntityMobileCard,
  ErrorState,
  FormPageSkeleton,
  PageBack,
  Pagination,
  SoftTip,
  DirectoryTable,
  type DirectoryColumn,
  TruncatedText,
} from "@/components/primitives";
import { IconMail, IconRotateCcw } from "@/constants/icons";
import { useClinicId } from "@/hooks/shared/use-clinic-id";
import { useEmailMessage } from "@/hooks/api/use-emails";
import { useLanguage } from "@/providers";
import { ROUTES } from "@/constants/routes";
import { formatDateTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import {
  EmailPreviewPane,
  EmailStatus,
  emailSplitClass,
} from "./email-display";

function RecipientCards({
  recipients,
  columns,
}: {
  recipients: EmailRecipientDelivery[];
  columns: DirectoryColumn<EmailRecipientDelivery>[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {recipients.map((recipient) => (
        <EntityMobileCard
          key={recipient.id}
          title={recipient.name}
          tags={<EmailStatus status={recipient.status} />}
          meta={
            <DirectoryMeta
              columns={columns}
              item={recipient}
              ids={["updated", "attempts", "error"]}
            />
          }
        />
      ))}
    </div>
  );
}

export function EmailDetail({ id }: { id: string }) {
  const clinicId = useClinicId();
  const { t, lang, dir } = useLanguage();
  const [page, setPage] = useState(1);
  const query = useEmailMessage(clinicId, id, page);
  const message = query.data;
  const paging = query.isPlaceholderData;
  const pageCount = message
    ? Math.ceil(message.totalRecipients / message.limit)
    : 0;

  const columns: DirectoryColumn<EmailRecipientDelivery>[] = [
    {
      id: "recipient",
      label: t.emails.recipients,
      className: "w-[28%]",
      render: (row) => (
        <TruncatedText className="font-medium">{row.name || "-"}</TruncatedText>
      ),
    },
    {
      id: "status",
      label: t.emails.delivery,
      className: "w-[20%]",
      render: (row) => (
        <SoftTip label={t.emails.statusHints[row.status]}>
          <EmailStatus status={row.status} className="max-w-full" />
        </SoftTip>
      ),
    },
    {
      id: "updated",
      label: t.emails.updatedAt,
      className: "w-[24%]",
      cellClassName: "text-xs text-muted-foreground whitespace-normal",
      render: (row) => formatDateTime(row.updatedAt, "-", lang),
    },
    {
      id: "attempts",
      label: t.emails.attempts,
      className: "w-[10%]",
      cellClassName: "tabular-nums",
      render: (row) => row.attempts,
    },
    {
      id: "error",
      label: t.emails.lastError,
      className: "w-[18%]",
      cellClassName: "text-xs text-muted-foreground",
      render: (row) => (
        <TruncatedText lines={2}>{row.lastError ?? "-"}</TruncatedText>
      ),
    },
  ];

  return (
    <div className="flex min-h-full min-w-0 shrink-0 flex-col gap-4 pb-2">
      <PageBack
        className="shrink-0"
        backHref={ROUTES.EMAILS}
        actions={
          <div className="flex items-center gap-1.5">
            {message ? (
              <SoftTip
                label={`${message.recipientCount} ${t.emails.recipients}`}
              >
                <Badge
                  variant="default"
                  className="h-8 min-w-8 justify-center rounded-full px-2 tabular-nums"
                >
                  {message.recipientCount}
                </Badge>
              </SoftTip>
            ) : null}
            <SoftTip label={t.emails.refresh}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                aria-label={t.emails.refresh}
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                <IconRotateCcw
                  className={cn("size-4", query.isFetching && "animate-spin")}
                />
              </Button>
            </SoftTip>
          </div>
        }
      />
      {query.isLoading && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FormPageSkeleton />
        </div>
      )}
      {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
      {message && (
        <div className={emailSplitClass} dir="ltr">
          <div className="min-w-0 self-start lg:sticky lg:top-0">
            <EmailPreviewPane dir={dir} preview={message.rendered} />
          </div>
          <div
            className="order-first flex h-[calc(100dvh-var(--app-header-height)-2*var(--app-main-pad-y)-3.5rem)] min-h-0 min-w-0 flex-col gap-3 lg:order-none"
            dir={dir}
          >
            {!message.recipients.length ? (
              <EmptyState icon={IconMail} title={t.emails.noRecipients} size="compact" />
            ) : (
              <div
                className={cn(
                  "flex min-h-0 min-w-0 flex-1 flex-col gap-3",
                  paging && "opacity-60",
                )}
              >
                <DirectoryTable
                  rows={message.recipients}
                  columns={columns}
                  rowKey={(row) => row.id}
                  className="hidden md:flex"
                  tableClassName="min-w-[34rem]"
                />
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain md:hidden">
                  <RecipientCards
                    recipients={message.recipients}
                    columns={columns}
                  />
                </div>
                {pageCount > 1 && (
                  <div className="shrink-0">
                    <Pagination
                      page={page}
                      pageCount={pageCount}
                      totalItems={message.totalRecipients}
                      pageSize={message.limit}
                      resetScroll={false}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
