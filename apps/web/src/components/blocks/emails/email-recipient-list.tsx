"use client";

import { useState } from "react";
import type { EmailRecipientPreview } from "@clinic/types";
import { Button, Card, CardContent } from "@/components/ui";
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
  SelectionToggle,
  SoftTip,
} from "@/components/primitives";
import { useLanguage } from "@/providers";
import { getBilingualName } from "@/i18n";
import { IconClose, IconDelete, IconMail } from "@/constants/icons";

const PAGE_SIZE = 20;

export function EmailRecipientList({
  recipients,
  excluded = [],
  onExclude,
  onExcludeMany,
  disabled = false,
}: {
  recipients: EmailRecipientPreview[];
  excluded?: string[];
  onExclude?: (email: string, excluded: boolean) => void;
  onExcludeMany?: (emails: string[]) => void;
  disabled?: boolean;
}) {
  const { t, lang } = useLanguage();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const visible = onExclude
    ? recipients.filter((row) => !excluded.includes(row.email))
    : recipients;
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = visible.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const chosen = visible.filter((row) => selected.has(row.email));
  const selectionState =
    chosen.length === visible.length ? true : chosen.length ? "mixed" : false;
  const selectAll = (
    <SelectionToggle
      checked={selectionState}
      label={
        selectionState === true
          ? t.common.clearSelection
          : `${t.ui.selectAll} (${visible.length})`
      }
      disabled={disabled}
      onChange={(checked) =>
        setSelected(new Set(checked ? visible.map((row) => row.email) : []))
      }
    />
  );
  const selectRow = (row: EmailRecipientPreview) => (
    <SelectionToggle
      checked={selected.has(row.email)}
      label={`${t.common.selectRecipient}: ${row.name || row.email}`}
      disabled={disabled}
      className={
        !selected.has(row.email)
          ? "md:opacity-0 md:group-hover/directory:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
          : undefined
      }
      onChange={(checked) =>
        setSelected((current) => {
          const next = new Set(current);
          if (checked) next.add(row.email);
          else next.delete(row.email);
          return next;
        })
      }
    />
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
    ...(onExcludeMany
      ? [
          {
            id: "selection",
            label: "",
            header: selectAll,
            className: "w-12 ps-3! pe-1!",
            render: selectRow,
          },
        ]
      : []),
    {
      id: "recipient",
      label: t.common.name,
      cellClassName: "ps-1!",
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
      ? [
          {
            id: "remove",
            label: "",
            className: "w-10 px-1!",
            render: removeAction,
          },
        ]
      : []),
  ];

  if (!recipients.length || !visible.length) {
    return (
      <Card>
        <CardContent>
          <EmptyState icon={IconMail} title={t.emails.noRecipients} size="compact" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="@container space-y-2">
      {onExcludeMany && (
        <div
          className={`flex items-center justify-between gap-2 ${chosen.length ? "" : "@[40rem]:hidden"}`}
        >
          <div className="@[40rem]:hidden">{selectAll}</div>
          {chosen.length > 0 && (
            <div className="ms-auto flex items-center gap-2">
              <SoftTip label={t.common.clearSelection}>
                <Button
                  type="button"
                  aria-label={t.common.clearSelection}
                  size="icon"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => setSelected(new Set())}
                >
                  <IconClose className="size-4" />
                </Button>
              </SoftTip>
              <SoftTip label={`${t.common.remove} (${chosen.length})`}>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`${t.common.remove} (${chosen.length})`}
                  className="text-destructive hover:text-destructive"
                  disabled={disabled}
                  onClick={() => {
                    onExcludeMany(chosen.map((row) => row.email));
                    setSelected(new Set());
                  }}
                >
                  <IconDelete className="size-4" />
                </Button>
              </SoftTip>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 @[40rem]:hidden">
        {rows.map((row) => {
          const name = getBilingualName(row.name, row.nameAr, lang) || "—";
          return (
            <EntityMobileCard
              key={row.email}
              title={name}
              subtitle={<EmailLink value={row.email} className="text-xs" />}
              actions={
                <div className="flex items-center gap-2">
                  {onExcludeMany && selectRow(row)}
                  {removeAction(row)}
                </div>
              }
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
        className="hidden @[40rem]:flex"
        tableClassName={onExcludeMany ? "min-w-[36rem]" : "min-w-[32rem]"}
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
