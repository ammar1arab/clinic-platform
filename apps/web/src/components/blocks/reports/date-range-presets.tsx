'use client';

import { Button } from '@/components/ui';
import { DATE_RANGE_PRESETS } from '@/constants/report';

type Props = {
  onPick: (from: string, to: string) => void;
};

export function DateRangePresets({ onPick }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DATE_RANGE_PRESETS.map((preset) => (
        <Button
          key={preset.label}
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={() => {
            const { from, to } = preset.range();
            onPick(from, to);
          }}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
