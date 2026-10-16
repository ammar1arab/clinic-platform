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
import { IconCheck, IconMoon, IconSun, IconSystem } from '@/constants/icons';
import { useLanguage } from '@/providers/language-provider';

const OPTIONS = [
  { value: 'light', icon: IconSun },
  { value: 'dark', icon: IconMoon },
  { value: 'system', icon: IconSystem },
] as const;

export function ThemeOptions({
  presentation = 'menu',
  onSelect,
}: {
  presentation?: 'menu' | 'button';
  onSelect?: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const { t } = useLanguage();

  return OPTIONS.map(({ value, icon: Icon }) => {
    const label = value === 'light'
      ? t.layout.light
      : value === 'dark'
        ? t.layout.dark
        : t.layout.system;
    const active = mounted && theme === value;

    return presentation === 'button' ? (
      <button
        key={value}
        type="button"
        aria-pressed={active}
        onClick={() => {
          setTheme(value);
          onSelect?.();
        }}
        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          active ? 'bg-accent/60 text-accent-foreground' : 'text-foreground'
        }`}
      >
        <Icon className="size-4" />
        <span className="flex-1 text-start">{label}</span>
        {active && <IconCheck className="ms-auto size-4" />}
      </button>
    ) : (
      <DropdownMenuItem
        key={value}
        onClick={() => setTheme(value)}
        className="cursor-pointer"
        data-active={active}
      >
        <Icon className="size-4 me-2" />
        {label}
        {active && <span className="ms-auto size-1.5 rounded-full bg-primary" />}
      </DropdownMenuItem>
    );
  });
}

export function ThemeToggle() {
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
        <ThemeOptions />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
