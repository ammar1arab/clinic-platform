'use client';

import { useLanguage } from '@/providers/language-provider';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { IconLanguage, IconCheck, IconGlobe } from '@/constants/icons';
import { SoftTip } from '@/components/primitives';

export function LanguageOptions() {
  const { language, setLanguage, t } = useLanguage();
  const options = [
    { value: 'en' as const, label: t.layout.english, icon: IconGlobe },
    { value: 'ar' as const, label: t.layout.arabic, icon: IconLanguage },
  ];

  return options.map(({ value, label, icon: OptionIcon }) => (
    <DropdownMenuItem
      key={value}
      onClick={() => setLanguage(value)}
      className="flex items-center justify-between"
    >
      <span className="flex items-center gap-2">
        <OptionIcon className="size-4 text-muted-foreground" aria-hidden="true" />
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
