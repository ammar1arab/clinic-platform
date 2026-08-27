"use client"

import * as React from "react"
import { format, setMonth as setDateMonth, setYear, addMonths, subMonths } from "date-fns"

import { cn } from "@/lib/utils"
import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"
import { IconCalendar, IconChevronLeft, IconChevronRight, IconClose } from '@/constants/icons'
import { keepNestedPortals } from '@/lib/overlay'

interface Props {

  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  fromDate?: Date
  toDate?: Date

  withDropdown?: boolean
}

function parseISO(value?: string): Date | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i),
  label: format(new Date(2020, i, 1), "MMM"),
}))

function buildYears(from: Date, to: Date, reverse: boolean) {
  const years: number[] = []
  for (let y = from.getFullYear(); y <= to.getFullYear(); y++) years.push(y)
  return reverse ? years.reverse() : years
}

function clampToRange(date: Date, from?: Date, to?: Date) {
  let next = date
  if (from && next < from) next = from
  if (to && next > to) next = to
  return next
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  fromDate,
  toDate,
  withDropdown = false,
}: Props) {
  const [open, setOpen] = React.useState(false)
  const selected = parseISO(value)

  const rangeStart = React.useMemo(() => {
    return fromDate ?? (withDropdown ? new Date(1920, 0, 1) : undefined);
  }, [fromDate, withDropdown]);

  const rangeEnd = React.useMemo(() => {
    return toDate ?? (withDropdown ? new Date() : undefined);
  }, [toDate, withDropdown]);

  const [month, setMonth] = React.useState<Date>(
    () => selected ?? rangeEnd ?? new Date(),
  );

  const [prevValue, setPrevValue] = React.useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      const next = parseISO(value);
      if (next) setMonth(next);
    }
  }

  const years = React.useMemo(() => {
    if (!rangeStart || !rangeEnd) return [];
    return buildYears(rangeStart, rangeEnd, true);
  }, [rangeStart, rangeEnd]);

  const disabledMatcher = [
    ...(fromDate ? [{ before: fromDate }] : []),
    ...(toDate ? [{ after: toDate }] : []),
  ]

  const goMonth = (delta: number) => {
    setMonth((prev) =>
      clampToRange(delta > 0 ? addMonths(prev, 1) : subMonths(prev, 1), rangeStart, rangeEnd),
    )
  }

  const onMonthSelect = (m: string) => {
    setMonth((prev) => clampToRange(setDateMonth(prev, Number(m)), rangeStart, rangeEnd))
  }

  const onYearSelect = (y: string) => {
    setMonth((prev) => clampToRange(setYear(prev, Number(y)), rangeStart, rangeEnd))
  }

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          data-empty={!selected}
          className={cn(
            "h-8 w-full cursor-pointer justify-start px-2.5 font-normal data-[empty=true]:text-muted-foreground",
            className,
          )}
        >
          <IconCalendar className="size-4 opacity-70" />
          <span className="flex-1 truncate text-left">
            {selected ? format(selected, "MMM d, yyyy") : placeholder}
          </span>
          {selected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear date"
              className="cursor-pointer rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onChange("")
              }}
            >
              <IconClose className="size-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={keepNestedPortals}
      >
        <div className="flex flex-col">
          {withDropdown ? (
            <div className="flex items-center gap-1.5 border-b p-2.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer"
                onClick={() => goMonth(-1)}
                aria-label="Previous month"
              >
                <IconChevronLeft className="size-4" />
              </Button>

              <Select value={String(month.getMonth())} onValueChange={onMonthSelect}>
                <SelectTrigger className="h-8 flex-1 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-200 max-h-60">
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="cursor-pointer">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(month.getFullYear())} onValueChange={onYearSelect}>
                <SelectTrigger className="h-8 w-[5.5rem] cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-200 max-h-60">
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)} className="cursor-pointer">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer"
                onClick={() => goMonth(1)}
                aria-label="Next month"
              >
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          ) : null}

          <Calendar
            mode="single"
            selected={selected}
            month={month}
            onMonthChange={setMonth}
            captionLayout="label"
            hideNavigation={withDropdown}
            startMonth={rangeStart}
            endMonth={rangeEnd}
            disabled={disabledMatcher.length ? disabledMatcher : undefined}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : "")
              if (date) setMonth(date)
              setOpen(false)
            }}
            className="rounded-none border-0"
          />

          <div className="flex items-center justify-between gap-2 border-t px-2.5 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              disabled={
                !!rangeEnd &&
                new Date(new Date().toDateString()) > new Date(rangeEnd.toDateString())
              }
              onClick={() => {
                const today = clampToRange(new Date(), rangeStart, rangeEnd)
                onChange(format(today, "yyyy-MM-dd"))
                setMonth(today)
                setOpen(false)
              }}
            >
              Today
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
