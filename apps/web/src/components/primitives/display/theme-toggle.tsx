'use client';

import { useTheme } from 'next-themes';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { useMounted } from '@/hooks/shared/use-mounted';
import { SoftTip } from '@/components/primitives';
import { IconMoon, IconSun, IconSystem } from '@/constants/icons';
import { useLanguage } from '@/providers/language-provider';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: IconSun },
  { value: 'dark', label: 'Dark', icon: IconMoon },
  { value: 'system', label: 'System', icon: IconSystem },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <SoftTip label={t.layout.themeToggle}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t.layout.themeToggle}>
            <IconSun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <IconMoon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </DropdownMenuTrigger>
      </SoftTip>
      <DropdownMenuContent align="end" className="w-36">
        {OPTIONS.map(({ value, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="cursor-pointer"
            data-active={mounted && theme === value}
          >
            <Icon className="size-4 me-2" />
            {value === 'light'
              ? t.layout.light
              : value === 'dark'
                ? t.layout.dark
                : t.layout.system}
            {mounted && theme === value && (
              <span className="ms-auto size-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
