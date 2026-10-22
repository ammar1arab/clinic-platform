"use client";

import { DEFAULT_PAGE_SIZE } from "@/components/primitives/display/pagination";

import Link from "next/link";
import {
  EMAIL_DELIVERY_GROUPS,
  type EmailDeliveryGroup,
  type EmailHistoryInput,
  type EmailMessageSummary,
} from "@clinic/types";
import {
  Badge,
  Button,
  Popover,
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
  FilterPanel,
  FilterTrigger,
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
  IconMail,
  IconSettings,
} from "@/constants/icons";
import { ROUTES } from "@/constants/routes";
import { useClinicId } from "@/hooks/shared/use-clinic-id";
import { useSessionStorageState } from "@/hooks/shared/use-session-storage-state";
import { useEmailHistory } from "@/hooks/api/use-emails";
import { useRouteNav } from "@/hooks/shared/use-route-nav";
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
  status: EmailDeliveryGroup | typeof FILTER_ALL;
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

const deliveryStatuses = Object.keys(EMAIL_DELIVERY_GROUPS) as EmailDeliveryGroup[];

function asDeliveryStatus(value: string): HistoryState["status"] {
  return deliveryStatuses.find((status) => status === value) ?? FILTER_ALL;
}

export function EmailHistory() {
  const clinicId = useClinicId();
  const { t, lang } = useLanguage();
  const { go, prefetch } = useRouteNav();
  const [history, setHistory] = useSessionStorageState<HistoryState>(`${clinicId || 'none'}:email-history`, initialHistory);
  const { page, search, from, to, status, kind } = history;
  const dispatch = (action: HistoryAction) => setHistory((previous) => historyReducer(previous, action));
  const invalidDates = !!from && !!to && from > to;
  const activeCount =
    (from ? 1 : 0) +
    (to ? 1 : 0) +
    (status !== FILTER_ALL ? 1 : 0) +
    (kind !== MESSAGE_KIND.ALL ? 1 : 0);
  const filters: EmailHistoryInput = {
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: search || undefined,
    from: from || undefined,
    to: to ? `${to}T23:59:59.999Z` : undefined,
    group: status === FILTER_ALL ? undefined : status,
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
      className: "w-[26%]",
      render: (message) => (
        <TruncatedText className="font-medium" lines={2}>
          {message.subject}
        </TruncatedText>
      ),
    },
    {
      id: "type",
      label: t.emails.type,
      className: "w-[11%]",
      render: (message) => (
        <Badge variant={message.isTest ? "warning" : "info"}>
          <span>{message.isTest ? t.emails.test : t.emails.campaign}</span>
        </Badge>
      ),
    },
    {
      id: "delivery",
      label: t.emails.delivery,
      className: "w-[11%]",
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
      className: "w-[9%]",
      cellClassName: "tabular-nums",
      render: (message) => message.recipientCount,
    },
    {
      id: "created",
      label: t.emails.createdAt,
      className: "w-[17%]",
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
    <div className="page-fill gap-2.5">
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
                <FilterTrigger count={activeCount} />
                <FilterPanel count={activeCount} onClear={resetFilters}>
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
                        {Object.entries(t.emails.deliveryGroups).map(
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
                </FilterPanel>
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
          rows={20}
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
              tableClassName="min-w-[60rem]"
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
              totalItems={query.data.total}
              pageSize={DEFAULT_PAGE_SIZE}
              onPageChange={(value) => dispatch({ type: "page", value })}
            />
          </div>
        ))}
    </div>
  );
}
