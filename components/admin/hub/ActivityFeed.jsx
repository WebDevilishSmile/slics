'use client';

import { useRef, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress } from '@mui/material';

import { ACTIVITY_KINDS } from '@/constants';
import { apiRequest } from '@/lib/apiRequest';
import { softPressSx, softRaisedSmall, softToggleSx } from '@/components/utility/soft';
import ActivityList from './ActivityList';

// The full activity feed on /admin/super/activity (docs/SUPER-ADMIN-HUB.md
// stage D): filter chips in one row above the list (none on means every
// kind), and "Load more" for older rows. Changing the filters reloads from
// the newest row; the list keeps showing until the new one arrives.
export default function ActivityFeed({ initial }) {
  const [kinds, setKinds] = useState([]);
  const [rows, setRows] = useState(initial.rows);
  const [next, setNext] = useState(initial.next);
  const [loading, setLoading] = useState(null); // 'filter' | 'more' | null
  const [error, setError] = useState('');
  // Only the newest filter request may land.
  const request = useRef(0);

  const load = async ({ chosen, before, mode }) => {
    const id = ++request.current;
    setLoading(mode);
    setError('');
    const params = new URLSearchParams();
    if (chosen.length) params.set('kinds', chosen.join(','));
    if (before) params.set('before', before);
    const { data, error: loadError } = await apiRequest(`/api/activity?${params}`, { method: 'GET' });
    if (id !== request.current) return;
    setLoading(null);
    if (loadError) return setError(loadError);
    setRows((current) => (before ? [...current, ...data.data.rows] : data.data.rows));
    setNext(data.data.next);
  };

  const toggle = (key) => {
    const chosen = kinds.includes(key) ? kinds.filter((kind) => kind !== key) : [...kinds, key];
    setKinds(chosen);
    load({ chosen, mode: 'filter' });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        role='group'
        aria-label='Show only'
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
      >
        {ACTIVITY_KINDS.map((kind) => (
          <Chip
            key={kind.key}
            label={kind.label}
            component='button'
            aria-pressed={kinds.includes(kind.key)}
            onClick={() => toggle(kind.key)}
            clickable
            sx={[softToggleSx, { minHeight: '2.5rem', borderRadius: 999 }]}
          />
        ))}
      </Box>

      <Box aria-busy={loading === 'filter'} sx={{ opacity: loading === 'filter' ? 0.6 : 1, transition: 'opacity 150ms' }}>
        <ActivityList
          rows={rows}
          emptyText={kinds.length ? 'Nothing of these kinds yet.' : 'Nothing yet.'}
        />
      </Box>

      {error && <Alert severity='error'>{error}</Alert>}

      {next && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={() => load({ chosen: kinds, before: next, mode: 'more' })}
            disabled={loading !== null}
            startIcon={loading === 'more' ? <CircularProgress size={16} color='inherit' /> : null}
            sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
          >
            {loading === 'more' ? 'Loading…' : 'Load more'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
