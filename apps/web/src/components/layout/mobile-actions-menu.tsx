'use client';

import { useState } from 'react';
import { useAuth, useConfirm, useLanguage } from '@/providers';
import { Button, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui';
import { LanguageOptions } from '@/components/primitives/display/language-switcher';
import { ThemeOptions } from '@/components/primitives/display/theme-toggle';
import { IconLanguage, IconLogout, IconRotateCcw, IconSun } from '@/constants/icons';
import { playRefreshSound } from '@/lib/feedback-sound';
import { queryClient } from '@/lib/query-client';
import { toast } from 'sonner';

const REFRESH_PARAM = '_cureva_refresh';

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
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshApp = async () => {
    if (refreshing) return;
    if (document.querySelector('main form, main [contenteditable="true"]')) {
      const accepted = await confirm({
        title: t.common.reloadPage,
        description: t.common.refreshUnsaved,
        confirmLabel: t.common.reloadPage,
      });
      if (!accepted) return;
    }
    if (!navigator.onLine) {
      toast.error(t.common.refreshOffline);
      return;
    }
    queryClient.clear();
    setRefreshing(true);
    playRefreshSound();
    try {
      navigator.vibrate?.([12, 35, 12]);
    } catch {}
    window.setTimeout(() => {
      const next = new URL(window.location.href);
      next.searchParams.set(REFRESH_PARAM, String(Date.now()));
      window.location.replace(next.href);
    }, 420);
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
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
        <DropdownMenuContent align="end" className="grid w-auto min-w-0 grid-cols-4 gap-1.5 p-2">
          <DropdownMenuItem
            aria-label={t.emails.refresh}
            disabled={refreshing}
            onSelect={() => void refreshApp()}
            className="size-10 justify-center rounded-xl p-0"
          >
            <IconRotateCcw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              aria-label={t.layout.languageSwitcher}
              className="size-10 justify-center rounded-xl p-0 [&>svg:last-child]:hidden"
            >
              <IconLanguage className="size-4" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <LanguageOptions />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              aria-label={t.layout.themeToggle}
              className="size-10 justify-center rounded-xl p-0 [&>svg:last-child]:hidden"
            >
              <IconSun className="size-4" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <ThemeOptions />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem
            aria-label={t.auth.logout}
            variant="destructive"
            onSelect={() => setSignOutOpen(true)}
            className="size-10 justify-center rounded-xl p-0"
          >
            <IconLogout className="size-4" />
          </DropdownMenuItem>
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
