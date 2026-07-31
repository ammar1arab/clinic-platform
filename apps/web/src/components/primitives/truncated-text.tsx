import { cn } from '@/lib/utils';

type Props = {
  children: string;
  className?: string;

  title?: string;
};



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
