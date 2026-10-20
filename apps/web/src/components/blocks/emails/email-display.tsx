"use client";

import {
  EMAIL_DELIVERY_STATUS,
  EMAIL_DELIVERY_GROUPS,
  type EmailDeliveryGroup,
  type EmailDeliveryStatus,
  type EmailMessageSummary,
  type EmailPreviewResponse,
} from "@clinic/types";
import { useCallback } from "react";
import { useTheme } from "next-themes";
import { Badge, Card, CardContent, Skeleton } from "@/components/ui";
import { EmptyState, ErrorState } from "@/components/primitives";
import { IconMail } from "@/constants/icons";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers";

export const emailSplitClass =
  "grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,13fr)]";

const STATUS_VARIANT = {
  [EMAIL_DELIVERY_STATUS.DELIVERED]: "success",
  [EMAIL_DELIVERY_STATUS.FAILED]: "destructive",
  [EMAIL_DELIVERY_STATUS.BOUNCED]: "destructive",
  [EMAIL_DELIVERY_STATUS.COMPLAINED]: "destructive",
  [EMAIL_DELIVERY_STATUS.SUPPRESSED]: "destructive",
  [EMAIL_DELIVERY_STATUS.QUEUED]: "warning",
  [EMAIL_DELIVERY_STATUS.PROCESSING]: "warning",
  [EMAIL_DELIVERY_STATUS.DELAYED]: "warning",
  [EMAIL_DELIVERY_STATUS.ACCEPTED]: "info",
} as const satisfies Record<
  EmailDeliveryStatus,
  "success" | "destructive" | "warning" | "info"
>;

export function EmailStatus({
  status,
  count,
  className,
}: {
  status: EmailDeliveryStatus;
  count?: number;
  className?: string;
}) {
  const { t } = useLanguage();
  const label = t.emails.statuses[status];
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      {count === undefined ? label : `${label} ${count}`}
    </Badge>
  );
}

export function EmailDeliveryCounts({
  counts,
}: {
  counts: EmailMessageSummary["counts"];
}) {
  const { t } = useLanguage();
  const variants = { pending: 'warning', sent: 'success', attention: 'destructive', skipped: 'muted' } as const;
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(EMAIL_DELIVERY_GROUPS) as EmailDeliveryGroup[]).map((group) => {
        const count = EMAIL_DELIVERY_GROUPS[group].reduce((sum, status) => sum + (counts[status] ?? 0), 0);
        return count > 0 ? <Badge key={group} variant={variants[group]}>{t.emails.deliveryGroups[group]} {count}</Badge> : null;
      })}
    </div>
  );
}

const PREVIEW_LAYOUT = `html,body{margin:0;height:auto;overflow:hidden}img,table{max-width:100%}img{height:auto}body,td,div{overflow-wrap:anywhere}`;

const DARK_PREVIEW = `<style>
:root{color-scheme:dark}
${PREVIEW_LAYOUT}
html,body{background:oklch(0.15 0.012 260)!important;color:oklch(0.96 0.005 260)!important}
body>table{background:transparent!important}
body>table>tbody>tr>td>table,[data-email-shell]{background:oklch(0.18 0.014 260)!important}
td,h1,td>div{color:oklch(0.96 0.005 260)!important}
td[style*="border-top"]{border-top-color:oklch(0.28 0.014 260)!important}
td[style*="border-top"] p,td[data-email-footer] a{color:oklch(0.68 0.012 260)!important}
td[style*="background:#"]>p{color:#fff!important}
</style>`;

const LIGHT_PREVIEW = `<style>${PREVIEW_LAYOUT}</style>`;

function fitPreviewFrame(frame: HTMLIFrameElement) {
  const pane = frame.closest<HTMLElement>("[data-email-preview]");
  const minimumHeight = pane
    ? Number.parseFloat(getComputedStyle(pane).height) || 0
    : 0;
  const body = frame.contentDocument?.body;
  if (!body) return;
  const gap = body.querySelector<HTMLElement>("td[data-email-gap]");
  if (gap) {
    const contentHeight =
      body.getBoundingClientRect().height - gap.getBoundingClientRect().height;
    const spacing = Math.max(
      Number(gap.getAttribute("height")) || 0,
      minimumHeight - contentHeight,
    );
    gap.style.height = `${Math.ceil(spacing)}px`;
    gap.style.lineHeight = "0";
  }
  const height = Math.ceil(
    Math.max(
      minimumHeight,
      body.scrollHeight,
      body.getBoundingClientRect().height,
    ),
  );
  frame.style.height = `${Math.max(height, 1)}px`;
}

function previewDocument(html: string, dark: boolean) {
  const style = dark ? DARK_PREVIEW : LIGHT_PREVIEW;
  return html.includes("</head>")
    ? html.replace("</head>", `${style}</head>`)
    : `${style}${html}`;
}

export function EmailPreviewSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        "h-full min-h-0 flex-1 gap-0 overflow-hidden py-0",
        className,
      )}
    >
      <CardContent className="flex h-full min-h-0 flex-1 flex-col p-0">
        <div className="flex flex-col items-center gap-3 bg-primary/10 px-6 py-7">
          <Skeleton className="size-12 rounded-full bg-primary/20" />
          <Skeleton className="h-4 w-36 bg-primary/25" />
        </div>
        <div className="flex flex-1 flex-col gap-3 px-6 py-6">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="mt-3 h-3 w-3/5" />
        </div>
        <div className="mt-auto flex flex-col items-center gap-2 border-t border-border px-6 py-5">
          <Skeleton className="h-3 w-40" />
          <div className="flex gap-2">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="size-5 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmailPreviewPane({
  preview,
  empty = false,
  emptyTitle,
  error = false,
  loading = false,
  onRetry,
  dir,
}: {
  preview?: EmailPreviewResponse | null;
  empty?: boolean;
  emptyTitle?: string;
  error?: boolean;
  loading?: boolean;
  onRetry?: () => void;
  dir?: "ltr" | "rtl";
}) {
  const { t } = useLanguage();
  return (
    <div
      data-email-preview
      className="flex h-[calc(100dvh-var(--app-header-height)-2*var(--app-main-pad-y)-3.5rem)] min-h-0 min-w-0 flex-col lg:h-[calc(100cqh-4px)]"
      dir={dir}
    >
      {empty ? (
        <Card className="flex min-h-48 flex-1 items-center justify-center">
          <EmptyState
            icon={IconMail}
            title={emptyTitle ?? t.emails.previewEmpty}
            size="compact"
          />
        </Card>
      ) : error ? (
        <ErrorState onRetry={onRetry} />
      ) : preview ? (
        <EmailRenderedPreview preview={preview} />
      ) : loading ? (
        <EmailPreviewSkeleton className="flex-1" />
      ) : null}
    </div>
  );
}

export function EmailRenderedPreview({
  preview,
  frameClassName,
  className,
}: {
  preview: EmailPreviewResponse;
  frameClassName?: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const watchFrame = useCallback((frame: HTMLIFrameElement | null) => {
    if (!frame) return;
    let observer: ResizeObserver | undefined;
    const loaded = () => {
      observer?.disconnect();
      fitPreviewFrame(frame);
      const body = frame.contentDocument?.body;
      if (body) {
        observer = new ResizeObserver(() => fitPreviewFrame(frame));
        observer.observe(body);
        const scrollArea = frame.closest("[data-page-scroll]");
        if (scrollArea) observer.observe(scrollArea);
      }
    };
    frame.addEventListener("load", loaded);
    if (
      frame.contentDocument?.readyState === "complete" &&
      frame.contentDocument.body?.childElementCount
    )
      loaded();
    return () => {
      frame.removeEventListener("load", loaded);
      observer?.disconnect();
    };
  }, []);
  return (
    <Card
      className={cn(
        "min-h-0 w-full flex-1 gap-0 overflow-y-auto scrollbar-none bg-card py-0",
        className,
      )}
    >
      <CardContent className="p-0">
        <iframe
          key={dark ? "dark" : "light"}
          title={t.emails.preview}
          srcDoc={previewDocument(preview.html, dark)}
          ref={watchFrame}
          scrolling="no"
          sandbox="allow-same-origin"
          referrerPolicy="no-referrer"
          className={cn(
            "block h-[30rem] w-full border-0 bg-card",
            frameClassName,
          )}
        />
      </CardContent>
    </Card>
  );
}
