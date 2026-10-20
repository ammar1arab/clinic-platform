import { Button } from '@/components/ui';
import { IconBookmark } from '@/constants/icons';
import { cn } from '@/lib/utils';
import { SoftTip } from './soft-tip';

export function PinMark({ label, active = false, disabled = false, onClick, className }: { label: string; active?: boolean; disabled?: boolean; onClick?: () => void; className?: string }) {
  const icon = <IconBookmark aria-hidden className={cn('size-4 transition-colors duration-(--motion-fast) motion-reduce:transition-none', active ? 'pin-pop fill-primary text-primary' : 'text-muted-foreground group-hover/pin:text-primary')} />;
  return (
    <SoftTip label={label}>
      {onClick ? (
        <Button type="button" variant="ghost" size="icon" aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick} className={cn('group/pin size-7 shrink-0', className)}>{icon}</Button>
      ) : (
        <span role="img" aria-label={label} className={cn('grid size-7 shrink-0 place-items-center', className)}>{icon}</span>
      )}
    </SoftTip>
  );
}
