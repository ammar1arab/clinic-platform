'use client';

import { Badge, Button, Skeleton } from '@/components/ui';
import { IconWell, SoftTip } from '@/components/primitives';
import { ButtonSpinner } from '@/components/primitives';
import { cn } from '@/lib/utils';
import type { PatientBillingSummary, PatientPackageDto } from '@clinic/types';
import {
  PACKAGE_CURRENCY,
  canCoverVisit,
  formatPackageBalance,
  formatPackageRedeemCost,
} from '@/lib/package-balance';
import { IconPackage, IconPayment } from '@/constants/icons';
import { useLanguage } from '@/providers';

interface Props {
  billing: PatientBillingSummary | undefined;
  isLoading?: boolean;

  coveringPackageId?: string | null;
  payable: number;

  canRedeem: boolean;

  pendingPackageId?: string | null;
  onSelectPending?: (patientPackageId: string | null) => void;
  onRedeem: (patientPackageId: string) => void;
  onRelease: () => void;
  redeemPending?: boolean;
  releasePending?: boolean;
  disabledReason?: string | null;
}

export function PatientBalancePanel({
  billing,
  isLoading,
  coveringPackageId,
  payable,
  canRedeem,
  pendingPackageId,
  onSelectPending,
  onRedeem,
  onRelease,
  redeemPending,
  releasePending,
  disabledReason,
}: Props) {
  const { t } = useLanguage();
  const packages = billing?.packages ?? [];
  const outstanding = Number(billing?.outstanding ?? 0);
  const unpaidVisits = billing?.unpaidVisits ?? 0;
  const hasContent = packages.length > 0 || outstanding > 0;

  if (isLoading) {
    return (
      <div className="space-y-2.5 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-40" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (!hasContent) return null;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <IconWell icon={IconPayment} size="sm" accent="muted" />
        <div className="min-w-0">
          <p className="text-sm font-medium">{t.appointments.patientBalance}</p>
          <p className="text-[11px] text-muted-foreground">
            {t.appointments.balanceDesc}
          </p>
        </div>
      </div>

      {outstanding > 0 && (
        <div className="flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-2 text-sm">
          <span className="text-muted-foreground">
            {t.appointments.previousDues}
            <span className="ms-1 text-xs">
              ({unpaidVisits} {unpaidVisits === 1 ? t.appointments.unpaidVisit : t.appointments.unpaidVisits})
            </span>
          </span>
          <span className="font-semibold tabular-nums text-destructive">
            {outstanding.toFixed(3)} {PACKAGE_CURRENCY}
          </span>
        </div>
      )}

      {packages.length > 0 && (
        <ul className="space-y-2">
          {packages.map((pkg) => (
            <PackageRow
              key={pkg.id}
              pkg={pkg}
              payable={payable}
              covering={coveringPackageId === pkg.id}
              pending={pendingPackageId === pkg.id}
              canRedeem={canRedeem}
              redeemPending={redeemPending}
              releasePending={releasePending}
              disabledReason={disabledReason}
              onSelectPending={onSelectPending}
              onRedeem={onRedeem}
              onRelease={onRelease}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PackageRow({
  pkg,
  payable,
  covering,
  pending,
  canRedeem,
  redeemPending,
  releasePending,
  disabledReason,
  onSelectPending,
  onRedeem,
  onRelease,
}: {
  pkg: PatientPackageDto;
  payable: number;
  covering: boolean;
  pending: boolean;
  canRedeem: boolean;
  redeemPending?: boolean;
  releasePending?: boolean;
  disabledReason?: string | null;
  onSelectPending?: (id: string | null) => void;
  onRedeem: (id: string) => void;
  onRelease: () => void;
}) {
  const { t, lang } = useLanguage();
  const covers = canCoverVisit(pkg, payable);
  const costLabel = formatPackageRedeemCost(pkg, payable, lang);
  const busy = redeemPending || releasePending;

  return (
    <li
      className={cn(
        'rounded-md border px-2.5 py-2.5 transition-colors',
        covering
          ? 'border-success/30 bg-success/5'
          : pending
            ? 'border-primary/30 bg-primary/5'
            : 'border-border/70 bg-muted/20',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex items-start gap-2">
          <IconWell icon={IconPackage} size="sm" accent={covering ? 'success' : 'muted'} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{pkg.packageName}</p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {formatPackageBalance(pkg, lang)}
            </p>
            {covering ? (
              <Badge variant="success" className="mt-1">
                {t.appointments.coveringThisVisitCharged.replace('{cost}', costLabel)}
              </Badge>
            ) : covers ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {t.appointments.useForThisVisit.replace('{cost}', costLabel)}
              </p>
            ) : (
              <Badge variant="destructive" className="mt-1">
                {t.appointments.notEnoughBalance}
              </Badge>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {covering ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={onRelease}
            >
              {releasePending ? <ButtonSpinner className="me-0" /> : t.common.remove}
            </Button>
          ) : canRedeem ? (
            <SoftTip label={!covers ? t.appointments.insufficientBalance : t.appointments.usePackage}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy || !covers}
                onClick={() => onRedeem(pkg.id)}
              >
                {redeemPending ? <ButtonSpinner className="me-0" /> : t.appointments.usePackage}
              </Button>
            </SoftTip>
          ) : onSelectPending ? (
            <SoftTip
              label={
                !covers
                  ? t.appointments.insufficientBalance
                  : disabledReason ?? t.appointments.packageAppliedAfterCreate
              }
            >
              <Button
                type="button"
                variant={pending ? 'default' : 'secondary'}
                size="sm"
                disabled={!covers || busy}
                onClick={() => onSelectPending(pending ? null : pkg.id)}
              >
                {pending ? t.appointments.selected : t.appointments.usePackage}
              </Button>
            </SoftTip>
          ) : (
            <SoftTip label={disabledReason ?? t.appointments.usePackage}>
              <Button type="button" variant="secondary" size="sm" disabled>
                {t.appointments.usePackage}
              </Button>
            </SoftTip>
          )}
        </div>
      </div>
    </li>
  );
}
