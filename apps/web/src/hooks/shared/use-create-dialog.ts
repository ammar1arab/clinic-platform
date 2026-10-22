'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const CREATE_PARAM = 'create';

export function createHref(href: string) {
  return `${href}?${CREATE_PARAM}=1`;
}

export function useCreateDialog() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requested = params.get(CREATE_PARAM) === '1';
  const [open, setOpenState] = useState(requested);
  const setOpen = (next: boolean) => {
    setOpenState(next);
    if (!next && requested) router.replace(pathname, { scroll: false });
  };
  return [open, setOpen] as const;
}
