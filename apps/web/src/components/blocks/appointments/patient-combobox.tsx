'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Patient } from '@/services/patients.service';

interface Props {
  patients: Patient[] | undefined;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  /** Allow clearing the selection (e.g. optional filters). */
  allowClear?: boolean;
}

/** Lightweight searchable patient picker (Popover + filtered list). */
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
      `${p.firstNameEn} ${p.lastNameEn}`.toLowerCase().includes(term),
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
          className="h-9 w-full justify-between px-2.5 font-normal"
        >
          <span className={cn('flex items-center gap-2 truncate', !selected && 'text-muted-foreground')}>
            <UserRound className="size-4 shrink-0 opacity-70" />
            {selected ? `${selected.firstNameEn} ${selected.lastNameEn}` : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
              <span className="truncate">
                {p.firstNameEn} {p.lastNameEn}
              </span>
              {p.id === value && <Check className="size-4 shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
