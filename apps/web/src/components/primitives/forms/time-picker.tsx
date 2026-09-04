'use client';

import * as React from 'react';
import { IconClose, IconTime } from '@/constants/icons';
import { cn } from '@/lib/utils';
import {
  formatClockParts,
  formatHour,
  pad2,
  parseClock,
  toClockValue,
} from '@/lib/datetime';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useLanguage } from '@/providers/language-provider';

interface Props {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  step?: 5 | 10 | 15 | 30;
}

function formatDisplay(value: string | undefined, lang: string) {
  const t = parseClock(value);
  if (!t) return null;
  return formatClockParts(t.hours, t.minutes, lang);
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function TimePicker({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  step = 5,
}: Props) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const parsed = parseClock(value);

  const resolvedPlaceholder = placeholder ?? t.common.selectTime;

  const minutes = React.useMemo(() => {
    const list: number[] = [];
    for (let m = 0; m < 60; m += step) list.push(m);
    return list;
  }, [step]);

  const hour = parsed?.hours ?? 9;
  const minute = parsed
    ? minutes.includes(parsed.minutes)
      ? parsed.minutes
      : minutes.reduce(
          (best, m) =>
            Math.abs(m - parsed.minutes) < Math.abs(best - parsed.minutes)
              ? m
              : best,
          0,
        )
    : 0;

  const setHour = (h: string) => {
    onChange(toClockValue(Number(h), minute));
  };

  const setMinute = (m: string) => {
    onChange(toClockValue(hour, Number(m)));
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
          <IconTime className="size-4 opacity-70" />
          <span className="flex-1 truncate text-start">
            {formatDisplay(value, lang) ?? resolvedPlaceholder}
          </span>
          {parsed && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label={t.common.clearTime}
              className="cursor-pointer rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange('');
              }}
            >
              <IconClose className="size-3.5" />
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
            <p className="text-[11px] font-medium text-muted-foreground">
              {t.common.hour}
            </p>
            <Select value={String(hour)} onValueChange={setHour}>
              <SelectTrigger className="h-9 w-full cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-200 max-h-56">
                {HOURS.map((h) => (
                  <SelectItem
                    key={h}
                    value={String(h)}
                    className="cursor-pointer"
                  >
                    {formatHour(h, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t.common.minute}
            </p>
            <Select value={String(minute)} onValueChange={setMinute}>
              <SelectTrigger className="h-9 w-full cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-200 max-h-56">
                {minutes.map((m) => (
                  <SelectItem
                    key={m}
                    value={String(m)}
                    className="cursor-pointer"
                  >
                    {pad2(m)}
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
            {t.common.clear}
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
                  Math.abs(n - now.getMinutes()) <
                  Math.abs(best - now.getMinutes())
                    ? n
                    : best,
                0,
              );
              onChange(toClockValue(now.getHours(), m));
              setOpen(false);
            }}
          >
            {t.common.now}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
