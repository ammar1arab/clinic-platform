'use client';

import { useCallback, useState } from 'react';
import {
  FeedbackOverlay,
  SUCCESS_OVERLAY_MS,
} from '@/components/primitives/states/feedback-overlay';

export function useFeedbackOverlay(onDone?: () => void) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  const celebrate = useCallback((nextTitle: string) => {
    setTitle(nextTitle);
    setOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setOpen(false);
    onDone?.();
  }, [onDone]);

  const overlay = (
    <FeedbackOverlay
      open={open}
      title={title}
      durationMs={SUCCESS_OVERLAY_MS}
      onClose={onClose}
    />
  );

  return { celebrate, overlay, open };
}
