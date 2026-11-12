import { Typography } from '@mui/material';
import NoAccess from '@/components/admin/NoAccess';
import { getAreaSession } from '@/lib/authz';
import { getRouteSuggestions } from '@/lib/db/routeSuggestions';
import RouteSuggestionsQueue from '@/components/admin/routeSuggestions/RouteSuggestionsQueue';
import HydrationGuard from '@/components/utility/HydrationGuard';

// Drivers' suggested routes (docs/SLIC-DIRECTIONS.md, stage 2). Approving one
// edits the SLIC's route, so it's the SLICs area's.
export default async function RouteSuggestionsPage() {
  if (!(await getAreaSession('slics'))) return <NoAccess />;

  const { open, closed } = await getRouteSuggestions();

  return (
    <>
      <Typography variant='sectionHeading'>Route Suggestions</Typography>
      <HydrationGuard>
        <RouteSuggestionsQueue initialOpen={open} initialClosed={closed} />
      </HydrationGuard>
    </>
  );
}
