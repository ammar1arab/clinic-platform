'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@/components/ui';
import { ButtonSpinner } from '@/components/primitives/states/button-spinner';
import { TruncatedText } from '@/components/primitives';
import { useLanguage } from '@/providers/language-provider';


type Target = { id: string; name: string };

interface Props<T extends Target> {
  controller: TwoStepDelete<T>;
  onConfirm: (item: T) => void;
  isPending?: boolean;

  warning: string;

  finalWarning: string;
  confirmLabel?: string;
}

export function TwoStepDeleteDialogs<T extends Target>({
  controller,
  onConfirm,
  isPending,
  warning,
  finalWarning,
  confirmLabel,
}: Props<T>) {
  const { t } = useLanguage();
  const { step1, step2 } = controller;
  const onStep1OpenChange = (open: boolean) => { if (!open) controller.cancelStep1(); };
  const onStep2OpenChange = (open: boolean) => { if (!open) controller.cancelStep2(); };
  const resolvedConfirmLabel = confirmLabel ?? t.common.confirmDeleteEverything;

  return (
    <>
      <Dialog open={!!step1} onOpenChange={onStep1OpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.common.deletePermanentlyTitle}</DialogTitle>
          </DialogHeader>
          <div className="min-w-0 space-y-3">
            <p className="rounded-md bg-muted px-2.5 py-1.5 text-sm font-medium">
              <TruncatedText>{step1?.name ?? ''}</TruncatedText>
            </p>
            <p className="text-sm text-muted-foreground">{warning}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onStep1OpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={controller.advance}>
              {t.common.continue}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!step2} onOpenChange={onStep2OpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.areYouSure}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="min-w-0 space-y-2 text-sm text-muted-foreground">
                <p className="rounded-md bg-muted px-2.5 py-1.5 font-medium text-foreground">
                  <TruncatedText>{step2?.name ?? ''}</TruncatedText>
                </p>
                <p>{finalWarning}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onStep2OpenChange(false)}>
              {t.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (step2) onConfirm(step2); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending && <ButtonSpinner />}
              {resolvedConfirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export type TwoStepDelete<T> = ReturnType<typeof useTwoStepDelete<T & { id: string }>>;

export function useTwoStepDelete<T extends { id: string }>() {
  const [step1, setStep1] = useState<T | null>(null);
  const [step2, setStep2] = useState<T | null>(null);

  return {
    step1,
    step2,
    ask: setStep1,
    advance: () => {
      setStep2(step1);
      setStep1(null);
    },
    cancelStep1: () => setStep1(null),
    cancelStep2: () => setStep2(null),
    clear: () => {
      setStep1(null);
      setStep2(null);
    },
  };
}
