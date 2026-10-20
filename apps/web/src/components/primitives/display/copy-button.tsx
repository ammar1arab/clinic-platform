"use client";

import { useState, type MouseEvent } from "react";
import { toast } from "sonner";
import { IconCheck, IconCopy } from "@/constants/icons";
import { useLanguage } from "@/providers";
import { Button } from "@/components/ui";
import { playCopySound } from "@/lib/feedback-sound";

export function CopyButton({
  value,
  variant = "icon",
}: {
  value: string;
  variant?: "icon" | "action";
}) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async (event: MouseEvent) => {
    event.stopPropagation();
    setPending(true);
    try {
      await navigator.clipboard.writeText(value);
      playCopySound();
      if (variant === "action") {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } else toast.success(t.common.copied);
    } catch {
      toast.error(t.common.copyFailed);
    } finally {
      setPending(false);
    }
  };
  if (variant === "action") {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        aria-label={t.common.copyValue}
        disabled={pending}
        onClick={copy}
      >
        {copied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
        {copied ? t.common.copied : t.common.copyValue}
      </Button>
    );
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`${t.common.copyValue}: ${value}`}
      disabled={pending}
      className="size-5 shrink-0 text-muted-foreground sm:opacity-0 sm:group-hover/contact:opacity-100 sm:group-hover/directory:opacity-100 sm:group-hover/card:opacity-100 sm:focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
      onClick={copy}
    >
      <IconCopy className="size-3" aria-hidden />
    </Button>
  );
}
