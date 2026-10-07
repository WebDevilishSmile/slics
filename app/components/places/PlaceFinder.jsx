'use client';

import { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import theme from '@/utils/theme';
import { useGeolocation } from '@/utils/clientFunctions';
import { distanceMiles } from '@/utils/geo';
import { CommentRefreshProvider } from '@/app/context/CommentRefreshContext';
import { slicLabel } from '../form/SlicTagsField';
import PlaceCard from './PlaceCard';
import PlaceFormDialog from './PlaceFormDialog';
import PlaceSearchBar from './PlaceSearchBar';

// Nearest first; a place without a parking pin can't be measured, so it sorts
// last. `|| 0` turns Infinity - Infinity (NaN) into "equal".
function byDistance(a, b) {
  return (a.miles ?? Infinity) - (b.miles ?? Infinity) || 0;
}

function emptyMessage({ placeCount, selectedSlics }) {
  if (placeCount === 0) {
    return 'No places yet. Add the first spot you know: fuel, food, a restroom, somewhere to rest.';
  }
  if (selectedSlics.length > 0) {
    return `Nothing tagged with ${selectedSlics.join(' or ')} in those categories yet. Know a spot? Add it.`;
  }
  return 'No places in those categories yet.';
}

// Whip It In & Out: every place arrives server-rendered (getPlaces), and the
// SLIC, category and distance filtering happens here. Place mutations call
// the shared refresh() to re-render the list; each thread fetches itself.
// `user` is `{ id, role }` for the signed-in driver.
function PlaceFinder({ places, slics, user }) {
  const [selectedSlics, setSelectedSlics] = useState([]);
  const [categories, setCategories] = useState([]); // none selected = all
  const [dialog, setDialog] = useState(null); // null, or { place } (null place = add)
  const location = useGeolocation();

  const slicLabels = useMemo(
    () => Object.fromEntries(slics.map((slic) => [slic.numSlic, slicLabel(slic)])),
    [slics],
  );

  const results = useMemo(() => {
    const matches = places
      .filter(
        (place) =>
          categories.length === 0 ||
          place.categories.some((category) => categories.includes(category)),
      )
      .filter(
        (place) =>
          selectedSlics.length === 0 ||
          place.slics.some((numSlic) => selectedSlics.includes(numSlic)),
      )
      .map((place) => ({
        place,
        miles:
          location.position && place.parking
            ? distanceMiles(location.position, place.parking)
            : null,
      }));
    if (location.position) matches.sort(byDistance);
    return matches;
  }, [places, categories, selectedSlics, location.position]);

  const toggleCategory = (value) =>
    setCategories((current) =>
      current.includes(value)
        ? current.filter((category) => category !== value)
        : [...current, value],
    );

  const canManage = (place) => place.addedByMe || user?.role === 'admin';

  return (
    <CommentRefreshProvider>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <PlaceSearchBar
          slics={slics}
          selectedSlics={selectedSlics}
          onSlicsChange={setSelectedSlics}
          categories={categories}
          onToggleCategory={toggleCategory}
          location={location}
          onAdd={() => setDialog({ place: null })}
        />

        {results.length === 0 ? (
          <Typography
            sx={{ maxWidth: theme.layout.width.panel, textAlign: 'center', mt: 2 }}
          >
            {emptyMessage({ placeCount: places.length, selectedSlics })}
          </Typography>
        ) : (
          <>
            <Typography variant='body2' color='text.secondary'>
              {results.length} place{results.length === 1 ? '' : 's'}
              {location.position && ', nearest first (straight-line)'}
            </Typography>
            {results.map(({ place, miles }) => (
              <PlaceCard
                key={place._id}
                place={place}
                miles={miles}
                slicLabels={slicLabels}
                user={user}
                canManage={canManage(place)}
                onEdit={(target) => setDialog({ place: target })}
              />
            ))}
          </>
        )}
      </Box>

      {dialog && (
        <PlaceFormDialog
          place={dialog.place}
          slics={slics}
          onClose={() => setDialog(null)}
        />
      )}
    </CommentRefreshProvider>
  );
}

export default PlaceFinder;
