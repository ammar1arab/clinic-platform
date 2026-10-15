"use client";

import Link from "next/link";
import { useReducer } from "react";
import {
  EMAIL_DELIVERY_STATUS,
  type EmailDeliveryStatus,
  type EmailHistoryInput,
  type EmailMessageSummary,
} from "@clinic/types";
import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  DatePicker,
  DIRECTORY_ACTION_CLASS,
  DirectoryToolbar,
  EmptyState,
  DirectoryMeta,
  EntityMobileCard,
  ErrorState,
  FormField,
  DirectoryTable,
  type DirectoryColumn,
  Pagination,
  SoftTip,
  TableFrame,
  TableSkeleton,
  TruncatedText,
} from "@/components/primitives";
import {
  IconAdd,
  IconClose,
  IconFilters,
  IconMail,
  IconSettings,
} from "@/constants/icons";
import { ROUTES } from "@/constants/routes";
import { useClinicId } from "@/hooks/shared/use-clinic-id";
import { useEmailHistory } from "@/hooks/api/use-emails";
import { useRouteNav } from "@/hooks/shared/use-route-nav";
import { keepNestedPortals } from "@/lib/overlay";
import { cn } from "@/lib/utils";
import { getBilingualName } from "@/i18n";
import { useLanguage } from "@/providers";
import { formatDateTime } from "@/lib/datetime";
import { EmailDeliveryCounts } from "./email-display";

const FILTER_ALL = "all";
const MESSAGE_KIND = {
  ALL: FILTER_ALL,
  CAMPAIGN: "campaign",
  TEST: "test",
} as const;

type HistoryState = {
  page: number;
  search: string;
  from: string;
  to: string;
  status: EmailDeliveryStatus | typeof FILTER_ALL;
  kind: (typeof MESSAGE_KIND)[keyof typeof MESSAGE_KIND];
};

type HistoryAction =
  | { type: "search"; value: string }
  | { type: "from"; value: string }
  | { type: "to"; value: string }
  | { type: "status"; value: HistoryState["status"] }
  | { type: "kind"; value: HistoryState["kind"] }
  | { type: "page"; value: number }
  | { type: "clear" };

const initialHistory: HistoryState = {
  page: 1,
  search: "",
  from: "",
  to: "",
  status: FILTER_ALL,
  kind: MESSAGE_KIND.ALL,
};

function historyReducer(
  state: HistoryState,
  action: HistoryAction,
): HistoryState {
  if (action.type === "clear") {
    return { ...initialHistory, search: state.search };
  }
  if (action.type === "page") return { ...state, page: action.value };
  return { ...state, page: 1, [action.type]: action.value };
}

const deliveryStatuses = Object.values(EMAIL_DELIVERY_STATUS);

function asDeliveryStatus(value: string): HistoryState["status"] {
  return deliveryStatuses.find((status) => status === value) ?? FILTER_ALL;
}

export function EmailHistory() {
  const clinicId = useClinicId();
  const { t, lang } = useLanguage();
  const { go, prefetch } = useRouteNav();
  const [{ page, search, from, to, status, kind }, dispatch] = useReducer(
    historyReducer,
    initialHistory,
  );
  const invalidDates = !!from && !!to && from > to;
  const activeCount =
    (from ? 1 : 0) +
    (to ? 1 : 0) +
    (status !== FILTER_ALL ? 1 : 0) +
    (kind !== MESSAGE_KIND.ALL ? 1 : 0);
  const filters: EmailHistoryInput = {
    page,
    limit: 20,
    search: search || undefined,
    from: from || undefined,
    to: to ? `${to}T23:59:59.999Z` : undefined,
    status: status === FILTER_ALL ? undefined : status,
    isTest: kind === MESSAGE_KIND.ALL ? undefined : kind === MESSAGE_KIND.TEST,
  };
  const query = useEmailHistory(clinicId, filters, !invalidDates);
  const searchLoading =
    !invalidDates &&
    (!query.data || query.isLoading || query.isPlaceholderData);
  const resetFilters = () => dispatch({ type: "clear" });

  const audienceFor = (message: EmailMessageSummary) =>
    message.audiences.map((audience) => t.emails[audience]).join(" · ") || "-";
  const senderFor = (message: EmailMessageSummary) =>
    getBilingualName(message.senderName, message.senderNameAr, lang) || "-";
  const columns: DirectoryColumn<EmailMessageSummary>[] = [
    {
      id: "subject",
      label: t.emails.subject,
      className: "w-[30%]",
      render: (message) => (
        <div className="space-y-1">
          <TruncatedText className="font-medium" lines={2}>
            {message.subject}
          </TruncatedText>
          {message.isTest && <Badge variant="outline">{t.emails.test}</Badge>}
        </div>
      ),
    },
    {
      id: "delivery",
      label: t.emails.delivery,
      className: "w-[20%]",
      render: (message) => <EmailDeliveryCounts counts={message.counts} />,
    },
    {
      id: "audience",
      label: t.emails.audience,
      className: "w-[14%]",
      render: (message) => (
        <TruncatedText lines={2}>{audienceFor(message)}</TruncatedText>
      ),
    },
    {
      id: "recipients",
      label: t.emails.recipients,
      className: "w-[8%]",
      cellClassName: "tabular-nums",
      render: (message) => message.recipientCount,
    },
    {
      id: "created",
      label: t.emails.createdAt,
      className: "w-[16%]",
      cellClassName: "text-xs text-muted-foreground",
      render: (message) => (
        <TruncatedText lines={2}>
          {formatDateTime(message.createdAt, "-", lang)}
        </TruncatedText>
      ),
    },
    {
      id: "sender",
      label: t.emails.sender,
      className: "w-[12%]",
      cellClassName: "text-muted-foreground",
      render: (message) => <TruncatedText>{senderFor(message)}</TruncatedText>,
    },
  ];

  return (
    <div className="page-fill gap-4">
      <div className="shrink-0">
        <DirectoryToolbar
          search={search}
          onSearchChange={(value) => {
            dispatch({ type: "search", value });
          }}
          searchPlaceholder={t.emails.searchHistory}
          searchLoading={searchLoading}
          actions={
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={t.common.filters}
                    className={cn(
                      DIRECTORY_ACTION_CLASS,
                      "border-border/70 bg-background/50",
                      activeCount > 0 && "border-primary/35 bg-primary/5",
                    )}
                  >
                    <IconFilters className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="hidden font-semibold sm:inline">
                      {t.common.filters}
                    </span>
                    {activeCount > 0 ? (
                      <Badge
                        variant="info"
                        className="ms-0 h-5 min-w-5 justify-center px-1 text-xs"
                      >
                        {activeCount}
                      </Badge>
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
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label={t.emails.from} labelClassName="text-xs">
                      <DatePicker
                        value={from}
                        onChange={(value) => {
                          dispatch({ type: "from", value });
                        }}
                        placeholder={t.common.from}
                      />
                    </FormField>
                    <FormField
                      label={t.emails.to}
                      labelClassName="text-xs"
                      error={
                        invalidDates ? t.emails.invalidDateRange : undefined
                      }
                    >
                      <DatePicker
                        value={to}
                        onChange={(value) => {
                          dispatch({ type: "to", value });
                        }}
                        placeholder={t.common.to}
                      />
                    </FormField>
                  </div>
                  <FormField label={t.emails.delivery} labelClassName="text-xs">
                    <Select
                      value={status}
                      onValueChange={(value) => {
                        dispatch({
                          type: "status",
                          value: asDeliveryStatus(value),
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 w-full rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t.emails.allStatuses}
                        </SelectItem>
                        {Object.entries(t.emails.statuses).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label={t.emails.type} labelClassName="text-xs">
                    <Select
                      value={kind}
                      onValueChange={(value) => {
                        dispatch({
                          type: "kind",
                          value:
                            value === MESSAGE_KIND.TEST
                              ? MESSAGE_KIND.TEST
                              : value === MESSAGE_KIND.CAMPAIGN
                                ? MESSAGE_KIND.CAMPAIGN
                                : MESSAGE_KIND.ALL,
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 w-full rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.emails.allTypes}</SelectItem>
                        <SelectItem value="campaign">
                          {t.emails.campaign}
                        </SelectItem>
                        <SelectItem value="test">{t.emails.test}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </PopoverContent>
              </Popover>
              <SoftTip label={t.emails.settings}>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(
                    DIRECTORY_ACTION_CLASS,
                    "border-border/70 bg-background/50 sm:w-8 sm:px-0",
                  )}
                >
                  <Link
                    href={ROUTES.EMAIL_SETTINGS}
                    aria-label={t.emails.settings}
                  >
                    <IconSettings className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                </Button>
              </SoftTip>
              <Button asChild size="sm" className={DIRECTORY_ACTION_CLASS}>
                <Link href={ROUTES.EMAIL_NEW} aria-label={t.emails.compose}>
                  <IconAdd className="size-3.5 shrink-0" />
                  <span className="hidden font-semibold sm:inline">
                    {t.emails.compose}
                  </span>
                </Link>
              </Button>
            </>
          }
        />
      </div>
      {searchLoading && (
        <TableSkeleton
          className="page-fill"
          rows={8}
          cols={6}
          hasHeader={false}
        />
      )}
      {query.isError && (
        <TableFrame className="page-fill">
          <ErrorState onRetry={() => void query.refetch()} />
        </TableFrame>
      )}
      {!invalidDates &&
        !searchLoading &&
        query.data &&
        (query.data.total === 0 ? (
          <TableFrame className="page-fill">
            <EmptyState
              icon={IconMail}
              title={t.emails.empty}
              description={t.emails.emptyDesc}
            />
          </TableFrame>
        ) : (
          <div className="page-fill min-h-0 gap-2">
            <DirectoryTable
              rows={query.data.items}
              columns={columns}
              rowKey={(message) => message.id}
              onOpen={(message) => go(ROUTES.EMAIL_DETAIL(message.id))}
              onPrefetch={(message) =>
                prefetch(ROUTES.EMAIL_DETAIL(message.id))
              }
              className="hidden md:flex"
              tableClassName="min-w-[52rem]"
            />
            <div className="page-fill overflow-y-auto overscroll-y-contain md:hidden">
              <div className="grid grid-cols-1 gap-4">
                {query.data.items.map((message) => (
                  <EntityMobileCard
                    key={message.id}
                    title={message.subject}
                    onMouseEnter={() =>
                      prefetch(ROUTES.EMAIL_DETAIL(message.id))
                    }
                    onClick={() => go(ROUTES.EMAIL_DETAIL(message.id))}
                    tags={
                      message.isTest ? (
                        <Badge variant="outline">{t.emails.test}</Badge>
                      ) : undefined
                    }
                    meta={
                      <DirectoryMeta
                        columns={columns}
                        item={message}
                        ids={["audience", "recipients", "created", "sender"]}
                      />
                    }
                    footer={<EmailDeliveryCounts counts={message.counts} />}
                  />
                ))}
              </div>
            </div>
            <Pagination
              page={page}
              pageCount={Math.ceil(query.data.total / 20)}
              totalItems={query.data.total}
              pageSize={20}
              onPageChange={(value) => dispatch({ type: "page", value })}
            />
          </div>
        ))}
    </div>
  );
}
