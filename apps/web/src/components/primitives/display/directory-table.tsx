"use client";

import type { ReactNode } from "react";
import {
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers";
import { EntityMetaStat } from "./entity-mobile-card";
import { EmailLink } from "./contact-link";
import { PreviewableAvatar, isRowControlClick } from "./image-preview";
import { TableFrame } from "./table-frame";
import { SoftTip } from "./soft-tip";
import { TruncatedText } from "./truncated-text";

export type DirectoryColumn<T> = {
  id: string;
  label: string;
  className?: string;
  cellClassName?: string;
  render: (item: T) => ReactNode;
};

export function DirectoryTable<T>({
  rows,
  columns,
  rowKey,
  onOpen,
  onPrefetch,
  inactive,
  className,
  tableClassName,
  scroll = true,
}: {
  rows: readonly T[];
  columns: readonly DirectoryColumn<T>[];
  rowKey: (item: T) => string;
  onOpen?: (item: T) => void;
  onPrefetch?: (item: T) => void;
  inactive?: (item: T) => boolean;
  className?: string;
  tableClassName?: string;
  scroll?: boolean;
}) {
  return (
    <TableFrame
      className={cn(
        "min-w-0",
        scroll ? "flex min-h-0 flex-1 flex-col" : "overflow-visible",
        className,
      )}
    >
      <div
        className={cn(
          "w-full min-w-0",
          scroll && "min-h-0 flex-1 overflow-auto overscroll-contain",
        )}
      >
        <Table
          className={cn(
            "table-fixed border-separate border-spacing-0 [&_th]:px-3 [&_td]:px-3 [&_td]:py-3",
            tableClassName,
          )}
        >
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    "whitespace-normal py-3 text-xs leading-5",
                    column.className,
                  )}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow
                key={rowKey(item)}
                tabIndex={onOpen ? 0 : undefined}
                className={cn(
                  onOpen &&
                    "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  inactive?.(item) && "opacity-60",
                )}
                onMouseEnter={() => onPrefetch?.(item)}
                onFocus={() => onPrefetch?.(item)}
                onClick={(event) => {
                  if (!isRowControlClick(event)) onOpen?.(item);
                }}
                onKeyDown={(event) => {
                  if (
                    onOpen &&
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    onOpen(item);
                  }
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      "max-w-0 overflow-hidden",
                      column.className,
                      column.cellClassName,
                    )}
                  >
                    {column.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableFrame>
  );
}

export function DirectoryIdentity({
  name,
  email,
  avatar,
  badge,
}: {
  name: string;
  email?: string | null;
  avatar?: { src?: string | null; seed: string };
  badge?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {avatar && <PreviewableAvatar {...avatar} size="sm" />}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <TruncatedText className="font-medium">{name || "-"}</TruncatedText>
          {badge}
        </div>
        {email && (
          <SoftTip label={email} className="w-full">
            <EmailLink
              value={email}
              className="w-full min-w-0 text-xs text-muted-foreground"
            />
          </SoftTip>
        )}
      </div>
    </div>
  );
}

export function DirectoryActions({
  active,
  disabled,
  onChange,
  children,
  name,
}: {
  active: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  children: ReactNode;
  name: string;
}) {
  const { t } = useLanguage();
  return (
    <div
      className="flex items-center justify-end gap-1"
      onClick={(event) => event.stopPropagation()}
    >
      <Switch
        checked={active}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={`${t.common.active}: ${name}`}
      />
      {children}
    </div>
  );
}

export function DirectoryMeta<T>({
  columns,
  item,
  ids,
}: {
  columns: readonly DirectoryColumn<T>[];
  item: T;
  ids: readonly string[];
}) {
  return columns
    .filter((column) => ids.includes(column.id))
    .map((column) => (
      <EntityMetaStat
        key={column.id}
        label={column.label}
        value={column.render(item)}
      />
    ));
}
