'use client';

import { useEffect } from 'react';
import { installCreatorFetch, uninstallCreatorFetch } from '@/lib/creatorFetch';

// Put first on every driver page in creator mode (slic/SlicLookupPage.jsx,
// the profile, history, covers, jobs and places pages): the page's API calls are
// answered with made-up data from then on (lib/creatorFetch.js), and leaving
// for a page that isn't faked gives the real fetch back. The made-up data
// itself stays in the tab (lib/creatorStore.js). It installs during render,
// not only in an effect, because the components after it start fetching in
// their own effects, which run before this one's.
export default function CreatorMode() {
  installCreatorFetch();
  useEffect(() => {
    installCreatorFetch();
    return uninstallCreatorFetch;
  }, []);
  return null;
}
