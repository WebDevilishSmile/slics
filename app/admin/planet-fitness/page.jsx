import { Typography } from '@mui/material';
import BackButton from '../../components/layout/BackButton';
import GymFinder from '../../components/gyms/GymFinder';
import HydrationGuard from '../../components/utility/HydrationGuard';
import { getAllGyms } from '@/utils/gymsApi';
import { getAllSlics } from '@/utils/slicsApi';
import { serializeGyms } from '@/utils/functions';

// Admin-only (app/admin/layout.jsx gates every /admin page): truck-accessible
// Planet Fitness gyms, found by the SLIC you're coming from / going to or by
// distance from where you are, with your own comments on each.
export default async function PlanetFitnessPage() {
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
      <BackButton />
      <Typography variant='sectionHeading'>Planet Fitness</Typography>
      {/* Client-only render: dates and "days ago" use the phone's time zone. */}
      <HydrationGuard>
        <GymFinder gyms={serializeGyms(gyms)} slics={slicOptions} />
      </HydrationGuard>
    </>
  );
}
