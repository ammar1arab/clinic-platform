'use client';

import { useCallback, useRef, useState } from 'react';
import {
  FeedbackOverlay,
  SUCCESS_OVERLAY_MS,
} from '@/components/primitives/states/feedback-overlay';

export function useFeedbackOverlay(onDone?: () => void) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const celebrate = useCallback((nextTitle: string) => {
    setTitle(nextTitle);
    setOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setOpen(false);
    doneRef.current?.();
  }, []);

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
