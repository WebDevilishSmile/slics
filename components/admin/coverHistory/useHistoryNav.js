'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Cover History's range and week live in the address (`?range=12&week=…`),
// and the server reads the weeks for them (app/admin/cover/history). `go`
// moves there, landing on a section (`hash`) when given; `pending` is true
// while the server reads.
export function useHistoryNav({ range, week }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const href = useCallback(
    (next = {}) => {
      const params = new URLSearchParams();
      params.set('range', next.range ?? range);
      const nextWeek = next.week === undefined ? week : next.week;
      if (nextWeek) params.set('week', nextWeek);
      return `${pathname}?${params}${next.hash ? `#${next.hash}` : ''}`;
    },
    [pathname, range, week],
  );

  const go = useCallback(
    (next) => {
      startTransition(() => router.push(href(next), { scroll: Boolean(next.hash) }));
    },
    [href, router],
  );

  return { go, href, pending };
}
