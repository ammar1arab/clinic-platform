'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {

  backHref: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}


export function PageBack({
  backHref,
  backLabel = 'Back',
  actions,
  className,
}: Props) {
  const router = useRouter();

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => router.push(backHref)}
      >
        <ArrowLeft className="size-3.5 mr-1" />
        {backLabel}
      </Button>
      {actions}
    </div>
  );
}
