'use client';

import { useLanguage } from '@/providers/language-provider';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { IconLanguage, IconCheck } from '@/constants/icons';
import { SoftTip } from '@/components/primitives';

export function LanguageOptions({
  presentation = 'menu',
  onSelect,
}: {
  presentation?: 'menu' | 'button';
  onSelect?: () => void;
}) {
  const { language, setLanguage, t } = useLanguage();
  const options = [
    { value: 'en' as const, label: t.layout.english },
    { value: 'ar' as const, label: t.layout.arabic },
  ];

  return (
    <>
      {options.map(({ value, label }) =>
        presentation === 'button' ? (
          <button
            key={value}
            type="button"
            aria-pressed={language === value}
            onClick={() => {
              setLanguage(value);
              onSelect?.();
            }}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              language === value ? 'bg-accent/60 text-accent-foreground' : 'text-foreground'
            }`}
          >
            {label}
            {language === value && <IconCheck className="size-4 ms-2" />}
          </button>
        ) : (
          <DropdownMenuItem
            key={value}
            onClick={() => setLanguage(value)}
            className="flex items-center justify-between"
          >
            {label}
            {language === value && <IconCheck className="size-4 ms-2" />}
          </DropdownMenuItem>
        ),
      )}
    </>
  );
}

export function LanguageSwitcher() {
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <SoftTip label={t.layout.languageSwitcher}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t.layout.languageSwitcher}
          >
            <IconLanguage className="size-5" />
          </Button>
        </DropdownMenuTrigger>
      </SoftTip>
      <DropdownMenuContent align="end">
        <LanguageOptions />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
