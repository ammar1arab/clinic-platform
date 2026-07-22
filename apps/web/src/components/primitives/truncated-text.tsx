import { cn } from '@/lib/utils';

type Props = {
  children: string;
  className?: string;
  /** Full value shown on hover. Defaults to `children`. */
  title?: string;
};

/**
 * Single-line ellipsis for table cells and dense UI.
 * Parent cell should allow shrinking (`max-w-0` / table-fixed column).
 */
export function TruncatedText({ children, className, title }: Props) {
  return (
    <span className={cn('block min-w-0 truncate', className)} title={title ?? children}>
      {children}
    </span>
  );
}
