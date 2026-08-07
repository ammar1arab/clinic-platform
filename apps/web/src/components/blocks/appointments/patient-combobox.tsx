'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatPersonName } from './appointment-display';
import type { Patient } from '@/services/patients.service';

interface Props {
  patients: Patient[] | undefined;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;

  allowClear?: boolean;
}


export function PatientCombobox({
  patients,
  value,
  onChange,
  placeholder = 'Select patient',
  allowClear = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = patients?.find((p) => p.id === value);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return patients ?? [];
    return (patients ?? []).filter((p) =>
      formatPersonName(p).toLowerCase().includes(term),
    );
  }, [patients, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto min-h-9 w-full min-w-0 justify-between gap-2 px-2.5 py-2 font-normal"
        >
          <span
            className={cn(
              'flex min-w-0 flex-1 items-start gap-2 text-left',
              !selected && 'text-muted-foreground',
            )}
          >
            <UserRound className="mt-0.5 size-4 shrink-0 opacity-70" />
            <span className="min-w-0 break-words line-clamp-2">
              {selected ? formatPersonName(selected) : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(100vw-1.5rem,var(--radix-popover-trigger-width))] max-w-[calc(100vw-1.5rem)] p-0"
        align="start"
      >
        <div className="flex items-center gap-2 border-b p-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients…"
            className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {allowClear && value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setQuery('');
                setOpen(false);
              }}
              className="flex w-full items-center rounded-sm px-2.5 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
            >
              Clear selection
            </button>
          )}
          {filtered.length === 0 && (
            <p className="px-2.5 py-4 text-center text-sm text-muted-foreground">
              No patients found.
            </p>
          )}
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(p.id);
                setQuery('');
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm hover:bg-muted',
                p.id === value && 'bg-muted',
              )}
            >
              <span className="min-w-0 flex-1 break-words line-clamp-2">
                {formatPersonName(p)}
              </span>
              {p.id === value && <Check className="size-4 shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
