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
};

export function ExportFormatButton({
  onSelect,
  pending = false,
  disabled = false,
  className,
  align = 'end',
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="default"
          variant="default"
          className={cn('h-8 rounded-lg', className)}
          disabled={disabled || pending}
        >
          {pending ? <ButtonSpinner /> : <IconExport className="size-4" />}
          Download
        </Button>
      </DropdownMenuTrigger>
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
