'use client';

import { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import theme from '@/utils/theme';
import { useGeolocation } from '@/hooks/useGeolocation';
import { distanceMiles } from '@/utils/geo';
import { CommentRefreshProvider } from '@/app/context/CommentRefreshContext';
import GymCard from './GymCard';
import GymFormDialog from './GymFormDialog';
import GymSearchBar from './GymSearchBar';
import { slicLabel } from '../form/SlicTagsField';

// Nearest first; a gym without a parking pin can't be measured, so it sorts
// last. `|| 0` turns Infinity - Infinity (NaN) into "equal".
function byDistance(a, b) {
  return (a.miles ?? Infinity) - (b.miles ?? Infinity) || 0;
}

function emptyMessage({ gymCount, statuses, selectedSlics }) {
  if (gymCount === 0) {
    return "No gyms yet. Add one once you've confirmed a trailer fits.";
  }
  if (statuses.length === 0) return 'Pick at least one status above.';
  if (selectedSlics.length > 0) {
    return `No gyms with that status are tagged with ${selectedSlics.join(' or ')} yet.`;
  }
  return 'No gyms with that status.';
}

// The Planet Fitness page: every gym arrives server-rendered (a personal list
// of a few dozen at most), and the SLIC, status and distance filtering all
// happens here. Mutations call the shared refresh() to re-render the list.
function GymFinder({ gyms, slics }) {
  const [selectedSlics, setSelectedSlics] = useState([]);
  const [statuses, setStatuses] = useState(['confirmed']);
  const [dialog, setDialog] = useState(null); // null, or { gym } (null gym = add)
  const location = useGeolocation();

  const slicLabels = useMemo(
    () => Object.fromEntries(slics.map((slic) => [slic.numSlic, slicLabel(slic)])),
    [slics],
  );

  const results = useMemo(() => {
    const matches = gyms
      .filter((gym) => statuses.includes(gym.status))
      .filter(
        (gym) =>
          selectedSlics.length === 0 ||
          gym.slics.some((numSlic) => selectedSlics.includes(numSlic)),
      )
      .map((gym) => ({
        gym,
        miles:
          location.position && gym.parking
            ? distanceMiles(location.position, gym.parking)
            : null,
      }));
    if (location.position) matches.sort(byDistance);
    return matches;
  }, [gyms, statuses, selectedSlics, location.position]);

  const toggleStatus = (value) =>
    setStatuses((current) =>
      current.includes(value)
        ? current.filter((status) => status !== value)
        : [...current, value],
    );

  return (
    <CommentRefreshProvider>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3, // room for the soft shadows between cards
        }}
      >
        <GymSearchBar
          slics={slics}
          selectedSlics={selectedSlics}
          onSlicsChange={setSelectedSlics}
          statuses={statuses}
          onToggleStatus={toggleStatus}
          location={location}
          onAdd={() => setDialog({ gym: null })}
        />

        {results.length === 0 ? (
          <Typography
            sx={{ maxWidth: theme.layout.width.panel, textAlign: 'center', mt: 2 }}
          >
            {emptyMessage({ gymCount: gyms.length, statuses, selectedSlics })}
          </Typography>
        ) : (
          <>
            <Typography variant='body2' color='text.secondary'>
              {results.length} gym{results.length === 1 ? '' : 's'}
              {location.position && ', nearest first (straight-line)'}
            </Typography>
            {results.map(({ gym, miles }) => (
              <GymCard
                key={gym._id}
                gym={gym}
                miles={miles}
                slicLabels={slicLabels}
                onEdit={(target) => setDialog({ gym: target })}
              />
            ))}
          </>
        )}
      </Box>

      {dialog && (
        <GymFormDialog
          gym={dialog.gym}
          slics={slics}
          onClose={() => setDialog(null)}
        />
      )}
    </CommentRefreshProvider>
  );
}

export default GymFinder;
