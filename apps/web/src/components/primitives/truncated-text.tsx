import { cn } from '@/lib/utils';

type Props = {
  children: string;
  className?: string;
  /** Full value shown on hover. Defaults to `children`. */
  title?: string;
};

/**
 * Ellipsis for table cells and dense UI.
 * Use `lines={2}` for soft wrap + clamp (mobile-friendly).
 * Parent should allow shrinking (`min-w-0` / table-fixed column).
 */
export function TruncatedText({
  children,
  className,
  title,
  lines = 1,
}: Props & { lines?: 1 | 2 | 3 }) {
  return (
    <span
      className={cn(
        'block min-w-0 break-words',
        lines === 1 ? 'truncate' : lines === 2 ? 'line-clamp-2' : 'line-clamp-3',
        className,
      )}
      title={title ?? children}
    >
      {children}
    </span>
  );
}
