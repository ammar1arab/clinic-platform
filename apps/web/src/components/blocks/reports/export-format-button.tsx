'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui';
import { ButtonSpinner } from '@/components/blocks/feedback';
import { SoftTip } from '@/components/primitives';
import { REPORT_FORMATS } from '@/constants/report';
import { IconExport } from '@/constants/icons';
import { cn } from '@/lib/utils';
import type { ReportFormat } from '@/services/reports.service';

type Props = {
  onSelect: (format: ReportFormat) => void;
  pending?: boolean;
  disabled?: boolean;
  className?: string;
  align?: 'start' | 'end' | 'center';
  compact?: boolean;
};

export function ExportFormatButton({
  onSelect,
  pending = false,
  disabled = false,
  className,
  align = 'end',
  compact = false,
}: Props) {
  return (
    <DropdownMenu>
      <SoftTip label={compact ? 'Download' : undefined}>
        <DropdownMenuTrigger asChild>
          <Button
            size="default"
            variant={compact ? 'outline' : 'default'}
            aria-label="Download"
            className={cn(
              'h-8 rounded-lg',
              compact &&
                'size-8 shrink-0 border-border/70 bg-background/50 px-0 shadow-2xs active:scale-95 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5',
              className,
            )}
            disabled={disabled || pending}
          >
            {pending ? <ButtonSpinner /> : <IconExport className="size-4" />}
            <span className={cn(compact && 'hidden font-semibold sm:inline')}>Download</span>
          </Button>
        </DropdownMenuTrigger>
      </SoftTip>
      <DropdownMenuContent align={align} className="w-52">
        <DropdownMenuLabel>Export format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {REPORT_FORMATS.map(({ key, label, ext, desc }) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onSelect(key)}
            className="flex-col items-start gap-0 py-2"
          >
            <div className="flex w-full items-center justify-between">
              <span className="font-semibold">{label}</span>
              <DropdownMenuShortcut>{ext}</DropdownMenuShortcut>
            </div>
            <span className="text-[11px] text-muted-foreground group-focus/menu-item:text-accent-foreground/70">
              {desc}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
