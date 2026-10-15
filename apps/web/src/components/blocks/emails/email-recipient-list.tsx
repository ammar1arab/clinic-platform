"use client";

import { useState } from "react";
import type { EmailRecipientPreview } from "@clinic/types";
import { Button } from "@/components/ui";
import {
  EmailLink,
  EmptyState,
  DirectoryMeta,
  EntityMobileCard,
  Pagination,
  PhoneLink,
  DirectoryTable,
  DirectoryIdentity,
  type DirectoryColumn,
  TruncatedText,
} from "@/components/primitives";
import { useLanguage } from "@/providers";
import { getBilingualName } from "@/i18n";
import { IconClose, IconMail } from "@/constants/icons";

const PAGE_SIZE = 20;

export function EmailRecipientList({
  recipients,
  excluded = [],
  onExclude,
  disabled = false,
}: {
  recipients: EmailRecipientPreview[];
  excluded?: string[];
  onExclude?: (email: string, excluded: boolean) => void;
  disabled?: boolean;
}) {
  const { t, lang } = useLanguage();
  const [page, setPage] = useState(1);
  const visible = onExclude
    ? recipients.filter((row) => !excluded.includes(row.email))
    : recipients;
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = visible.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const removeAction = (row: EmailRecipientPreview) =>
    onExclude ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label={`${t.common.remove} ${row.email}`}
        className="size-7 text-muted-foreground hover:text-destructive"
        onClick={() => onExclude(row.email, true)}
      >
        <IconClose className="size-3.5" />
      </Button>
    ) : null;
  const columns: DirectoryColumn<EmailRecipientPreview>[] = [
    {
      id: "recipient",
      label: t.common.name,
      className: "w-[38%]",
      render: (row) => (
        <DirectoryIdentity
          name={getBilingualName(row.name, row.nameAr, lang)}
          email={row.email}
        />
      ),
    },
    {
      id: "audience",
      label: t.emails.type,
      className: "w-[18%]",
      render: (row) => (
        <TruncatedText lines={2}>{t.emails[row.audience]}</TruncatedText>
      ),
    },
    {
      id: "department",
      label: t.emails.department,
      className: "w-[20%]",
      render: (row) => (
        <TruncatedText lines={2}>
          {getBilingualName(row.department, row.departmentAr, lang) || "-"}
        </TruncatedText>
      ),
    },
    {
      id: "phone",
      label: t.exports.phone,
      className: "w-[18%]",
      cellClassName: "text-muted-foreground",
      render: (row) => (
        <PhoneLink value={row.phone} className="block text-xs" />
      ),
    },
    ...(onExclude
      ? [{ id: "remove", label: "", className: "w-[6%]", render: removeAction }]
      : []),
  ];

  if (!recipients.length || !visible.length) {
    return <EmptyState icon={IconMail} title={t.emails.noRecipients} />;
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {rows.map((row) => {
          const name = getBilingualName(row.name, row.nameAr, lang) || "—";
          return (
            <EntityMobileCard
              key={row.email}
              title={name}
              subtitle={<EmailLink value={row.email} className="text-xs" />}
              actions={removeAction(row)}
              meta={
                <DirectoryMeta
                  columns={columns}
                  item={row}
                  ids={["audience", "phone", "department"]}
                />
              }
            />
          );
        })}
      </div>
      <DirectoryTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.email}
        className="hidden md:flex"
        tableClassName="min-w-[32rem]"
        scroll={false}
      />

      {pageCount > 1 && (
        <div className="sticky bottom-0 z-20 bg-background">
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            totalItems={visible.length}
            pageSize={PAGE_SIZE}
            resetScroll={false}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
