import { getCreatorMode, getSession } from '@/lib/authz';
import { creatorHistory, creatorHistoryPage } from '@/lib/creatorData';
import { getHistoryPage, parseHistoryQuery } from '@/lib/db/slicViews';

import CreatorMode from '@/components/creator/CreatorMode';
import { CreatorHistory } from '@/components/creator/CreatorPages';
import HistoryView from '@/components/history/HistoryView';
import PageContainer from '@/components/layout/PageContainer';
import RedirectMessage from '@/components/layout/RedirectMessage';
import HydrationGuard from '@/components/utility/HydrationGuard';
import { Typography } from '@mui/material';

const FILTER_KEYS = ['q', 'range', 'from', 'to', 'type', 'notes', 'sort'];

export default async function HistoryPage({ searchParams }) {
  const session = await getSession();

  if (!session) {
    return (
      <RedirectMessage
        heading='You must be signed in to view this page.'
        subheading='Please sign in and try again.'
        redirect='/sign-in'
      />
    );
  }

  if (!session.user.bmcMember) {
    return (
      <RedirectMessage
        heading='This page is available to members only.'
        subheading='Support SLICs on Buy Me a Coffee to access your history.'
        redirect='/sign-in'
      />
    );
  }

  // The filters live in the URL, so a reload or Back lands on the same view.
  // A malformed param just falls back to the unfiltered first page.
  const query = await searchParams;
  const parsed = parseHistoryQuery(query);
  const params = {};
  if (!parsed.error) {
    for (const key of FILTER_KEYS) {
      const value = Array.isArray(query[key]) ? query[key][0] : query[key];
      if (value) params[key] = value;
    }
  }

  // Creator mode (docs/CREATOR-MODE.md): made-up lookups, filtered the same
  // way in the browser, with nothing read from the database.
  if (await getCreatorMode(session)) {
    return (
      <PageContainer>
        <CreatorMode />
        <Typography variant='sectionHeading'>SLIC History</Typography>
        <HydrationGuard>
          <CreatorHistory initialPage={creatorHistoryPage(creatorHistory(), params)} initialParams={params} />
        </HydrationGuard>
      </PageContainer>
    );
  }

  const filters = parsed.error ? parseHistoryQuery({}).filters : parsed.filters;
  const initialPage = await getHistoryPage(session.user.id, { ...filters, cursor: null });

  return (
    <PageContainer>
      <Typography variant='sectionHeading'>SLIC History</Typography>

      {/* Days are grouped in the phone's time zone, so render on the client. */}
      <HydrationGuard>
        <HistoryView initialPage={initialPage} initialParams={params} />
      </HydrationGuard>
    </PageContainer>
  );
}
