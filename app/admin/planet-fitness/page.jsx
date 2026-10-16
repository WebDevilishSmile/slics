import { Typography } from '@mui/material';
import GymFinder from '@/components/gyms/GymFinder';
import HydrationGuard from '@/components/utility/HydrationGuard';
import { getAllGyms } from '@/lib/db/gyms';
import { getAllSlics } from '@/lib/db/slics';
import { serializeGyms } from '@/lib/serializers';
import NoAccess from '@/components/admin/NoAccess';
import { getAreaSession } from '@/lib/authz';

// Admin-only: truck-accessible Planet Fitness gyms, found by the SLIC you're
// coming from / going to or by distance from where you are, with your own
// comments on each.
export default async function PlanetFitnessPage() {
  if (!(await getAreaSession('gyms'))) return <NoAccess />;

  const [gyms, slics] = await Promise.all([getAllGyms(), getAllSlics()]);

  // Only what the SLIC pickers need — not every slic field.
  const slicOptions = slics
    .filter(({ numSlic }) => numSlic != null)
    .map(({ numSlic, alphaSlic, name }) => ({
      numSlic: String(numSlic),
      alphaSlic: alphaSlic || '',
      name: name || '',
    }));

  return (
    <>
      <Typography variant='sectionHeading'>Planet Fitness</Typography>
      {/* Client-only render: dates and "days ago" use the phone's time zone. */}
      <HydrationGuard>
        <GymFinder gyms={serializeGyms(gyms)} slics={slicOptions} />
      </HydrationGuard>
    </>
  );
}
