'use client';

import { Button } from '@/components/ui';
import { SoftTip } from '@/components/primitives';
import { ButtonSpinner } from '@/components/blocks/feedback';
import { cn } from '@/lib/utils';
import type { PatientBillingSummary, PatientPackageDto } from '@clinic/types';
import {
  PACKAGE_CURRENCY,
  canCoverVisit,
  formatPackageBalance,
  formatPackageRedeemCost,
} from '@/lib/package-balance';
import { IconPackage, IconPayment } from '@/constants/icons';

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
  const packages = billing?.packages ?? [];
  const outstanding = Number(billing?.outstanding ?? 0);
  const unpaidVisits = billing?.unpaidVisits ?? 0;
  const hasContent = packages.length > 0 || outstanding > 0;

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg border bg-muted/30 p-3">
        <div className="mb-2 h-4 w-32 rounded bg-muted" />
        <div className="h-10 rounded bg-muted" />
      </div>
    );
  }

  if (!hasContent) return null;

  return (
    <div className="space-y-3 rounded-lg border border-border/80 bg-card p-3">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground">
          <IconPayment className="size-3.5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">Patient balance</p>
          <p className="text-[11px] text-muted-foreground">
            IconPackage credit & previous dues for this visit
          </p>
        </div>
      </div>

      {outstanding > 0 && (
        <div className="flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-2 text-sm">
          <span className="text-muted-foreground">
            Previous dues
            <span className="ml-1 text-xs">
              ({unpaidVisits} unpaid {unpaidVisits === 1 ? 'visit' : 'visits'})
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
  const covers = canCoverVisit(pkg, payable);
  const costLabel = formatPackageRedeemCost(pkg, payable);
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
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-background text-muted-foreground">
            <IconPackage className="size-3.5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{pkg.packageName}</p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {formatPackageBalance(pkg)}
            </p>
            {covering ? (
              <p className="mt-0.5 text-[11px] font-medium text-success">
                Covering this visit · charged {costLabel}
              </p>
            ) : covers ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Use for this visit: {costLabel}
              </p>
            ) : (
              <p className="mt-0.5 text-[11px] text-destructive/80">
                Not enough balance for this visit
              </p>
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
              {releasePending ? <ButtonSpinner className="mr-0" /> : 'Remove'}
            </Button>
          ) : canRedeem ? (
            <SoftTip label={!covers ? 'Insufficient balance' : 'Use package'}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy || !covers}
                onClick={() => onRedeem(pkg.id)}
              >
                {redeemPending ? <ButtonSpinner className="mr-0" /> : 'Use package'}
              </Button>
            </SoftTip>
          ) : onSelectPending ? (
            <SoftTip
              label={
                !covers
                  ? 'Insufficient balance'
                  : disabledReason ?? 'Will apply after you create the appointment'
              }
            >
              <Button
                type="button"
                variant={pending ? 'default' : 'secondary'}
                size="sm"
                disabled={!covers || busy}
                onClick={() => onSelectPending(pending ? null : pkg.id)}
              >
                {pending ? 'Selected' : 'Use package'}
              </Button>
            </SoftTip>
          ) : (
            <SoftTip label={disabledReason ?? 'Use package'}>
              <Button type="button" variant="secondary" size="sm" disabled>
                Use package
              </Button>
            </SoftTip>
          )}
        </div>
      </div>
    </li>
  );
}
