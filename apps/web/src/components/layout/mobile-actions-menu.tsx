'use client';

import { useState } from 'react';
import { useAuth, useLanguage } from '@/providers';
import { Button, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui';
import { LanguageOptions } from '@/components/primitives/display/language-switcher';
import { ThemeOptions } from '@/components/primitives/display/theme-toggle';
import { IconChevronLeft, IconLanguage, IconLogout, IconRotateCcw, IconSun } from '@/constants/icons';
import { useAppRefresh } from '@/hooks/shared/use-app-refresh';

function AnimatedDots({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" className="flex size-5 items-center justify-center gap-[3px]">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          style={{ transitionDelay: `${dot * 45}ms` }}
          className={`size-1 rounded-full bg-current transition-transform duration-300 ease-out motion-reduce:transition-none ${
            open && dot === 0
              ? 'translate-x-1.5 scale-75'
              : open && dot === 1
                ? 'scale-125'
                : open && dot === 2
                  ? '-translate-x-1.5 scale-75'
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
  const [activePanel, setActivePanel] = useState<'actions' | 'language' | 'theme'>('actions');
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { refreshing, refreshApp, animation } = useAppRefresh({ animate: true });

  return (
    <>
      {animation}

      <DropdownMenu
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setActivePanel('actions');
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t.common.moreOptions}
            className="size-10 rounded-full transition-transform duration-200 active:scale-90"
          >
            <AnimatedDots open={open} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={activePanel === 'actions' ? 'w-[12.25rem] min-w-0 p-2' : 'w-44 p-1.5'}
        >
          <div key={activePanel} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150">
            {activePanel === 'actions' ? (
              <div className="grid grid-cols-4 gap-1.5">
                <DropdownMenuItem
                  aria-label={t.emails.refresh}
                  disabled={refreshing}
                  onSelect={() => void refreshApp()}
                  className="size-10 justify-center rounded-xl p-0"
                >
                  <IconRotateCcw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
                </DropdownMenuItem>
                <DropdownMenuItem
                  aria-label={t.layout.languageSwitcher}
                  onSelect={(event) => {
                    event.preventDefault();
                    setActivePanel('language');
                  }}
                  className="size-10 justify-center rounded-xl p-0"
                >
                  <IconLanguage className="size-4" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  aria-label={t.layout.themeToggle}
                  onSelect={(event) => {
                    event.preventDefault();
                    setActivePanel('theme');
                  }}
                  className="size-10 justify-center rounded-xl p-0"
                >
                  <IconSun className="size-4" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  aria-label={t.auth.logout}
                  variant="destructive"
                  onSelect={() => setSignOutOpen(true)}
                  className="size-10 justify-center rounded-xl p-0"
                >
                  <IconLogout className="size-4" />
                </DropdownMenuItem>
              </div>
            ) : (
              <>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setActivePanel('actions');
                  }}
                  className="mb-1 gap-1.5 px-2 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  <IconChevronLeft className="size-3.5 rtl:-scale-x-100" />
                  {t.common.back}
                </DropdownMenuItem>
                <DropdownMenuLabel className="px-2.5 py-1 text-[11px] normal-case tracking-normal">
                  {activePanel === 'language' ? t.layout.languageSwitcher : t.layout.themeToggle}
                </DropdownMenuLabel>
                {activePanel === 'language' ? <LanguageOptions /> : <ThemeOptions />}
              </>
            )}
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
