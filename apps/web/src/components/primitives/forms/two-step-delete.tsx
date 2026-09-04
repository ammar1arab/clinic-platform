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

export type TwoStepDeleteTarget = { id: string; name: string } | null;

interface Props {
  step1: TwoStepDeleteTarget;
  step2: TwoStepDeleteTarget;
  onStep1OpenChange: (open: boolean) => void;
  onStep2OpenChange: (open: boolean) => void;
  onContinue: () => void;
  onConfirm: () => void;
  isPending?: boolean;

  warning: string;

  finalWarning: string;
  confirmLabel?: string;
}

export function TwoStepDeleteDialogs({
  step1,
  step2,
  onStep1OpenChange,
  onStep2OpenChange,
  onContinue,
  onConfirm,
  isPending,
  warning,
  finalWarning,
  confirmLabel,
}: Props) {
  const { t } = useLanguage();
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
            <Button variant="destructive" onClick={onContinue}>
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
              onClick={onConfirm}
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
