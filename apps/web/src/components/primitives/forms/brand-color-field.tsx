'use client';

import { HexColorPicker } from 'react-colorful';
import { Button, Input, Popover, PopoverContent, PopoverTrigger } from '@/components/ui';

const FALLBACK = '#0f766e';

export function BrandColorField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const color = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : FALLBACK;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 px-2.5"
          aria-label={label}
        >
          <span
            className="size-5 shrink-0 rounded-md border border-border"
            style={{ backgroundColor: color }}
          />
          <span className="font-mono text-xs uppercase">{color}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto space-y-3">
        <HexColorPicker color={color} onChange={onChange} />
        <Input
          value={color}
          maxLength={7}
          spellCheck={false}
          aria-label={label}
          className="font-mono uppercase"
          onChange={(event) => {
            const next = event.target.value.trim();
            if (/^#[0-9A-Fa-f]{0,6}$/.test(next)) onChange(next);
          }}
          onBlur={() => {
            if (!/^#[0-9A-Fa-f]{6}$/.test(value)) onChange(FALLBACK);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
