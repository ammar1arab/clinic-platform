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
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [refreshComplete, setRefreshComplete] = useState(false);

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

    const surface = document.querySelector<HTMLElement>('main');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (surface && !reduceMotion) {
      surface.style.transition = 'translate 460ms cubic-bezier(0.16, 1, 0.3, 1)';
      surface.style.translate = '0 60px';
    }

    queryClient.clear();
    setRefreshProgress(0);
    setRefreshComplete(false);
    setRefreshing(true);
    window.requestAnimationFrame(() => setRefreshProgress(1));
    window.setTimeout(() => setRefreshComplete(true), reduceMotion ? 100 : 760);
    playRefreshSound();
    try {
      navigator.vibrate?.([12, 35, 12]);
    } catch {}
    window.setTimeout(() => {
      const next = new URL(window.location.href);
      next.searchParams.set(REFRESH_PARAM, String(Date.now()));
      window.location.replace(next.href);
    }, reduceMotion ? 420 : 1120);
  };

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-hidden={!refreshing}
        className={`pointer-events-none fixed inset-x-0 z-[60] flex justify-center transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
          refreshing ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
        }`}
        style={{ top: 'calc(var(--app-header-height) + 0.25rem)' }}
      >
        <svg viewBox="0 0 24 24" className="size-11 overflow-visible text-primary" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="text-muted-foreground/25"
          />
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${refreshProgress * 100} 100`}
            transform="rotate(-90 12 12)"
            className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
          />
          <path
            d="M12 6v11m-4-4 4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`origin-center transition-[transform,opacity] duration-300 ease-out ${
              refreshing && refreshProgress > 0 ? 'translate-y-1.5 opacity-0' : 'translate-y-0 opacity-90'
            }`}
          />
          <path
            d="M10 5h4v5h5v4h-5v5h-4v-5H5v-4h5z"
            fill="currentColor"
            className={`origin-center transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
              refreshing && refreshComplete ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
          />
        </svg>
      </div>

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
