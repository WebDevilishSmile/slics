import { Alert, Paper, Typography } from '@mui/material';

import NoAccess from '@/components/admin/NoAccess';
import CoverHistoryPage from '@/components/admin/coverHistory/CoverHistoryPage';
import { getAreaSession } from '@/lib/authz';
import { DEFAULT_RANGE, HISTORY_RANGES, getCoverHistory } from '@/lib/db/coverHistory';
import { isSaturday } from '@/lib/onCallSheet';

export const metadata = {
  title: 'Cover History · SLICs',
};

// Past cover weeks side by side (docs/COVER-BIDDING.md "Covers hub and
// History"). Checks the Covers area before reading anything, like every
// admin page (docs/SECURITY.md #7). `?range=` is how far back (8, 12, 26, 52
// weeks or all) and `?week=` the week shown up close.
export default async function CoverHistory({ searchParams }) {
  if (!(await getAreaSession('covers'))) return <NoAccess />;

  const params = await searchParams;
  const range = HISTORY_RANGES.includes(params?.range) ? params.range : DEFAULT_RANGE;
  const week = isSaturday(params?.week) ? params.week : undefined;

  let history = null;
  try {
    history = await getCoverHistory({ range, week });
  } catch (error) {
    console.error('Error loading cover history:', error);
  }

  return (
    <>
      <Typography variant='sectionHeading'>Cover History</Typography>
      {!history ? (
        <Paper variant='panel' sx={{ justifyContent: 'center', px: 2 }}>
          <Alert severity='error'>Couldn&apos;t read the cover weeks. Try again in a minute.</Alert>
        </Paper>
      ) : history.weeks.length === 0 ? (
        <Paper variant='panel' sx={{ justifyContent: 'center', px: 2 }}>
          <Typography color='text.secondary'>No cover weeks are saved yet.</Typography>
        </Paper>
      ) : (
        <CoverHistoryPage history={history} ranges={HISTORY_RANGES} />
      )}
    </>
  );
}
