import { getCreatorMode, getSession } from '@/lib/authz';
import { Typography } from '@mui/material';

import { getAllHubs } from '@/lib/db/slics';
import { CREATOR_HUBS, creatorUser } from '@/lib/creatorData';

import RedirectMessage from '@/components/layout/RedirectMessage';
import SlicLookupPage from '@/components/slic/SlicLookupPage';

// The lookup screen with only the UPS hubs in its list. It was /all until
// 2026-10-08; next.config.mjs redirects old links here.
export default async function Hubs({ searchParams }) {
  const session = await getSession();

  if (!session) {
    return (
      <RedirectMessage
        heading='You must be logged in to view SLICs.'
        redirect='/sign-in'
      />
    );
  }

  const heading = <Typography variant='sectionHeading'>All Hubs</Typography>;

  // Creator mode (docs/CREATOR-MODE.md): the made-up centers.
  if (await getCreatorMode(session)) {
    return (
      <SlicLookupPage
        creator
        searchParams={searchParams}
        slics={CREATOR_HUBS}
        user={creatorUser(session.user)}
        heading={heading}
      />
    );
  }

  const hubs = await getAllHubs();

  return (
    <SlicLookupPage
      searchParams={searchParams}
      slics={hubs}
      user={session.user}
      heading={heading}
    />
  );
}
