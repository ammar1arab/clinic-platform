'use client';

import type { ReactNode } from 'react';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import { IconChevronDown } from '@/constants/icons';
import { keepNestedPortals } from '@/lib/overlay';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';
import { AudienceChips } from './audience-chips';
import { FormField } from './form-field';

const EVERYONE = 'everyone';
const SPECIFIC = 'specific';

export function TargetAudience({
  everyoneLabel,
  specificLabel,
  specific,
  onSpecificChange,
  summary,
  disabled = false,
  error,
  children,
}: {
  everyoneLabel: string;
  specificLabel: string;
  specific: boolean;
  onSpecificChange: (specific: boolean) => void;
  summary: string;
  disabled?: boolean;
  error?: string;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <FormField label={t.common.targetAudience} error={error} className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="shrink-0">
          <AudienceChips
            label={t.common.targetAudience}
            value={specific ? SPECIFIC : EVERYONE}
            disabled={disabled}
            options={[{ value: EVERYONE, label: everyoneLabel }, { value: SPECIFIC, label: specificLabel }]}
            onChange={(next) => onSpecificChange(next === SPECIFIC)}
          />
        </div>
        <div
          inert={!specific}
          className={cn(
            'grid min-w-0 transition-[grid-template-columns,opacity] duration-[var(--overlay-duration)] ease-[var(--overlay-ease)] motion-reduce:transition-none',
            specific ? 'grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0',
          )}
        >
          <div className="min-w-0 overflow-hidden p-0.5 -m-0.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" size="sm" variant="ghost" disabled={disabled} className="max-w-full bg-muted font-medium text-foreground hover:bg-muted/70 aria-expanded:bg-muted">
                  <span className="truncate">{summary}</span>
                  <IconChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-max min-w-[15rem] max-w-[min(24rem,calc(100vw-2rem))] space-y-2 p-2.5" onInteractOutside={keepNestedPortals} onFocusOutside={keepNestedPortals}>
                {children}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </FormField>
  );
}
