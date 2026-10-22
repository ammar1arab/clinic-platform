'use client';

import { useState } from 'react';
import { useAuth, useLanguage } from '@/providers';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { LanguageOptions } from '@/components/primitives/display/language-switcher';
import { ThemeOptions } from '@/components/primitives/display/theme-toggle';
import { IconLanguage, IconLogout, IconRotateCcw, IconSun } from '@/constants/icons';
import { useAppRefresh } from '@/hooks/shared/use-app-refresh';
import { cn } from '@/lib/utils';

function AnimatedDots({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" className="flex size-5 items-center justify-center gap-[3px]">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className={`size-1 rounded-full bg-current transition-transform duration-300 ease-out motion-reduce:transition-none ${
            open && dot === 1
              ? '-translate-y-1.5 scale-125'
              : open
                ? '-translate-y-0.5 scale-110'
                : ''
          }`}
        />
      ))}
    </span>
  );
}

type Panel = 'language' | 'theme';

const PANELS = [
  { id: 'language', icon: IconLanguage, label: 'languageSwitcher' },
  { id: 'theme', icon: IconSun, label: 'themeToggle' },
] as const satisfies readonly { id: Panel; icon: typeof IconSun; label: 'languageSwitcher' | 'themeToggle' }[];

export function MobileActionsMenu() {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [shownPanel, setShownPanel] = useState<Panel>('language');
  const togglePanel = (next: Panel) => {
    setShownPanel(next);
    setPanel((current) => (current === next ? null : next));
  };
  const { refreshing, refreshApp, animation } = useAppRefresh({ animate: true });

  return (
    <>
      {animation}

      <DropdownMenu open={open} onOpenChange={(next) => { setOpen(next); if (!next) setPanel(null); }}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t.common.moreOptions}
            className="size-10 rounded-full transition-transform duration-200 hover:bg-transparent hover:text-foreground active:scale-90"
          >
            <AnimatedDots open={open} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[12.25rem] min-w-0 p-2"
        >
          <div className="grid grid-cols-4 gap-1.5">
            <DropdownMenuItem
              aria-label={t.emails.refresh}
              disabled={refreshing}
              onSelect={() => void refreshApp()}
              className="size-10 justify-center rounded-xl p-0"
            >
              <IconRotateCcw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
            </DropdownMenuItem>
            {PANELS.map(({ id, icon: Icon, label }) => (
              <DropdownMenuItem
                key={id}
                aria-label={t.layout[label]}
                aria-expanded={panel === id}
                onSelect={(event) => {
                  event.preventDefault();
                  togglePanel(id);
                }}
                className={cn('size-10 justify-center rounded-xl p-0', panel === id && 'bg-accent text-accent-foreground')}
              >
                <Icon className="size-4" />
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              aria-label={t.auth.logout}
              variant="destructive"
              onSelect={() => setSignOutOpen(true)}
              className="size-10 justify-center rounded-xl p-0"
            >
              <IconLogout className="size-4" />
            </DropdownMenuItem>
          </div>
          <div
            inert={!panel}
            className={cn(
              'grid transition-[grid-template-rows,opacity] duration-(--motion-normal) ease-(--motion-ease) motion-reduce:transition-none',
              panel ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <DropdownMenuSeparator className="-mx-2 my-2" />
              {shownPanel === 'language' ? <LanguageOptions /> : <ThemeOptions />}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <IconLogout />
            </AlertDialogMedia>
            <AlertDialogTitle>{t.auth.logout}</AlertDialogTitle>
            <AlertDialogDescription>{t.auth.logoutConfirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={logout}>
              {t.auth.logout}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
