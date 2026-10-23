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

function LanguageMark({ language }: { language: 'en' | 'ar' }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-5 items-center justify-center rounded-md bg-primary/10 text-[0.65rem] font-bold leading-none text-primary ring-1 ring-inset ring-primary/20"
    >
      {language === 'en' ? 'EN' : 'ع'}
    </span>
  );
}

export function LanguageOptions() {
  const { language, setLanguage, t } = useLanguage();
  const options = [
    { value: 'en' as const, label: t.layout.english },
    { value: 'ar' as const, label: t.layout.arabic },
  ];

  return options.map(({ value, label }) => (
    <DropdownMenuItem
      key={value}
      onClick={() => setLanguage(value)}
      className="flex items-center justify-between"
    >
      <span className="flex items-center gap-2">
        <LanguageMark language={value} />
        <span>{label}</span>
      </span>
      {language === value && <IconCheck className="size-4 ms-2" />}
    </DropdownMenuItem>
  ));
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
