'use client';

import { useLanguage } from '@/providers/language-provider';
import { Button } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { IconLanguage, IconCheck } from '@/constants/icons';
import { SoftTip } from '@/components/primitives';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

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
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className="flex items-center justify-between"
        >
          {t.layout.english}
          {language === 'en' && <IconCheck className="size-4 ms-2" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('ar')}
          className="flex items-center justify-between"
        >
          {t.layout.arabic}
          {language === 'ar' && <IconCheck className="size-4 ms-2" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
