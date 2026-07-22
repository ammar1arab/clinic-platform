'use client';

import * as React from 'react';
import { Clock, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  /** `HH:mm` (24h). Empty string when unset. */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Minute step (default 5). */
  step?: 5 | 10 | 15 | 30;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseTime(value?: string): { h: number; m: number } | null {
  if (!value || !/^\d{1,2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

function formatDisplay(value?: string) {
  const t = parseTime(value);
  if (!t) return null;
  const period = t.h >= 12 ? 'PM' : 'AM';
  const h12 = t.h % 12 || 12;
  return `${h12}:${pad(t.m)} ${period}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function TimePicker({
  value,
  onChange,
  placeholder = 'Pick a time',
  disabled,
  className,
  step = 5,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const parsed = parseTime(value);

  const minutes = React.useMemo(() => {
    const list: number[] = [];
    for (let m = 0; m < 60; m += step) list.push(m);
    return list;
  }, [step]);

  const hour = parsed?.h ?? 9;
  const minute = parsed
    ? minutes.includes(parsed.m)
      ? parsed.m
      : minutes.reduce((best, m) => (Math.abs(m - parsed.m) < Math.abs(best - parsed.m) ? m : best), 0)
    : 0;

  const setHour = (h: string) => {
    onChange(`${pad(Number(h))}:${pad(minute)}`);
  };

  const setMinute = (m: string) => {
    onChange(`${pad(hour)}:${pad(Number(m))}`);
  };

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          data-empty={!parsed}
          className={cn(
            'h-8 w-full cursor-pointer justify-start px-2.5 font-normal data-[empty=true]:text-muted-foreground',
            className,
          )}
        >
          <Clock className="size-4 opacity-70" />
          <span className="flex-1 truncate text-left">
            {formatDisplay(value) ?? placeholder}
          </span>
          {parsed && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear time"
              className="cursor-pointer rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange('');
              }}
            >
              <X className="size-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(100vw-2rem,16rem)] p-3"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (
            target?.closest('[data-slot="select-content"]') ||
            target?.closest('[data-radix-select-content]')
          ) {
            e.preventDefault();
          }
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Hour</p>
            <Select value={String(hour)} onValueChange={setHour}>
              <SelectTrigger className="h-9 w-full cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-200 max-h-56">
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)} className="cursor-pointer">
                    {pad(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Minute</p>
            <Select value={String(minute)} onValueChange={setMinute}>
              <SelectTrigger className="h-9 w-full cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-200 max-h-56">
                {minutes.map((m) => (
                  <SelectItem key={m} value={String(m)} className="cursor-pointer">
                    {pad(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => {
              const now = new Date();
              const m = minutes.reduce(
                (best, n) =>
                  Math.abs(n - now.getMinutes()) < Math.abs(best - now.getMinutes()) ? n : best,
                0,
              );
              onChange(`${pad(now.getHours())}:${pad(m)}`);
              setOpen(false);
            }}
          >
            Now
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
