import { unstable_cache } from 'next/cache';

import { countCommentsSince } from '@/lib/db/comments';
import { countSlicViewsSince } from '@/lib/db/slicViews';

const DAYS = 30;

// What the app did for drivers lately, for the About page and the membership
// prompt (docs/BMC-SUPPORT.md stage 4). One count each over `slicViews` and
// `comments`, cached for an hour across requests.
export const getImpactNumbers = unstable_cache(
  async () => {
    const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
    const [lookups, tips] = await Promise.all([countSlicViewsSince(since), countCommentsSince(since)]);
    return { days: DAYS, lookups, tips };
  },
  ['impact-numbers'],
  { revalidate: 3600 },
);
