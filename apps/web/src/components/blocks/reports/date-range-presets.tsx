'use client';

import { Button } from '@/components/ui';
import { getDateRangePresets } from '@/constants/report';
import { useLanguage } from '@/providers';

type Props = {
  onPick: (from: string, to: string) => void;
};

export function DateRangePresets({ onPick }: Props) {
  const { t } = useLanguage();


  return (
    <div className="flex flex-wrap gap-1.5">
      {getDateRangePresets(t).map((preset) => (
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
