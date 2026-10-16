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
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { LanguageOptions } from '@/components/primitives/display/language-switcher';
import { ThemeOptions } from '@/components/primitives/display/theme-toggle';
import { IconLanguage, IconLogout, IconRotateCcw, IconSun } from '@/constants/icons';
import { useAppRefresh } from '@/hooks/shared/use-app-refresh';

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

export function MobileActionsMenu() {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const { refreshing, refreshApp, animation } = useAppRefresh({ animate: true });

  return (
    <>
      {animation}

      <DropdownMenu open={open} onOpenChange={setOpen}>
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
          onInteractOutside={(event) => {
            if (event.target instanceof Element && event.target.closest('[data-slot="popover-content"]')) {
              event.preventDefault();
            }
          }}
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
            <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
              <PopoverTrigger asChild>
                <DropdownMenuItem
                  aria-label={t.layout.languageSwitcher}
                  onSelect={(event) => event.preventDefault()}
                  className="size-10 justify-center rounded-xl p-0"
                >
                  <IconLanguage className="size-4" />
                </DropdownMenuItem>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="center" sideOffset={8} collisionPadding={12} className="w-40 p-1.5">
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
                  <IconLanguage className="size-3.5" />
                  {t.layout.languageSwitcher}
                </div>
                <LanguageOptions presentation="button" onSelect={() => setLanguageOpen(false)} />
              </PopoverContent>
            </Popover>
            <Popover open={themeOpen} onOpenChange={setThemeOpen}>
              <PopoverTrigger asChild>
                <DropdownMenuItem
                  aria-label={t.layout.themeToggle}
                  onSelect={(event) => event.preventDefault()}
                  className="size-10 justify-center rounded-xl p-0"
                >
                  <IconSun className="size-4" />
                </DropdownMenuItem>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="center" sideOffset={8} collisionPadding={12} className="w-40 p-1.5">
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
                  <IconSun className="size-3.5" />
                  {t.layout.themeToggle}
                </div>
                <ThemeOptions presentation="button" onSelect={() => setThemeOpen(false)} />
              </PopoverContent>
            </Popover>
            <DropdownMenuItem
              aria-label={t.auth.logout}
              variant="destructive"
              onSelect={() => setSignOutOpen(true)}
              className="size-10 justify-center rounded-xl p-0"
            >
              <IconLogout className="size-4" />
            </DropdownMenuItem>
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
