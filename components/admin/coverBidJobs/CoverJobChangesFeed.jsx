'use client';

import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from '@mui/material';

import { markCoverJobChangesSeen } from '@/lib/coverJobChangesStore';
import { formatWeekEnding } from '@/lib/onCallSheet';
import { softInset, softPressSx, softRaisedSmall } from '@/components/utility/soft';
import { changeJob, describeCoverJobChange } from './coverJobChangeText';

// Shown before "Show all", unless more of them are new.
const COLLAPSED = 3;

async function fetchChanges(last) {
  const params = new URLSearchParams();
  if (last) {
    params.set('before', last.seenAt);
    params.set('beforeId', last._id);
  }
  const res = await fetch(`/api/cover-job-changes?${params}`, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't load the changes.");
  return data.data;
}

// What changed on the cover weeks' tabs between refreshes, every week, newest
// first and grouped by day (docs/ON-CALL-SHEET-SYNC.md, "Alerts"). Changes
// since the admin last looked carry "New" until they leave the page; showing
// them moves the mark, which clears the /admin banner and the menu badge.
// Tapping a change opens its week (`onSelectWeek(weekEnding)`). Bump
// `refreshKey` to refetch, after a refresh saved the week.
export default function CoverJobChangesFeed({ refreshKey, onSelectWeek }) {
  const [state, setState] = useState({ changes: [], more: false, loading: true, error: '' });
  // The mark from before this visit: undefined until the first page arrives,
  // then kept, so a refetch doesn't take the "New" labels away.
  const [newSince, setNewSince] = useState(undefined);
  const [expanded, setExpanded] = useState(false);
  const marked = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    fetchChanges()
      .then((data) => {
        if (cancelled) return;
        setState({ changes: data.changes, more: data.more, loading: false, error: '' });
        setNewSince((previous) => (previous === undefined ? data.seenAt : previous));
      })
      .catch((err) => {
        if (!cancelled) setState((previous) => ({ ...previous, loading: false, error: err.message }));
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const { changes, more, loading, error } = state;
  const isNew = (change) => newSince !== undefined && (!newSince || change.seenAt > newSince);
  const newest = changes[0]?.seenAt ?? null;
  useEffect(() => {
    if (newSince === undefined || !newest) return;
    if ((newSince && newest <= newSince) || (marked.current && newest <= marked.current)) return;
    marked.current = newest;
    markCoverJobChangesSeen(newest);
  }, [newest, newSince]);

  const loadOlder = async () => {
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    try {
      const data = await fetchChanges(changes.at(-1));
      setState((previous) => ({
        changes: [...previous.changes, ...data.changes],
        more: data.more,
        loading: false,
        error: '',
      }));
    } catch (err) {
      setState((previous) => ({ ...previous, loading: false, error: err.message }));
    }
  };

  const newCount = changes.filter(isNew).length;
  const shown = expanded ? changes : changes.slice(0, Math.max(COLLAPSED, newCount));
  // First the rest of what's loaded, then older pages.
  const hiddenLoaded = shown.length < changes.length;
  const showMore = () => {
    setExpanded(true);
    if (!hiddenLoaded) loadOlder();
  };
  const days = [];
  for (const change of shown) {
    const day = dayjs(change.seenAt).format('dddd, MMM D');
    if (days.at(-1)?.day !== day) days.push({ day, changes: [] });
    days.at(-1).changes.push(change);
  }

  return (
    <Box component='section' aria-labelledby='cover-job-changes-heading' sx={{ mt: 3 }}>
      <Typography id='cover-job-changes-heading' variant='h6' component='h3'>
        Job changes
      </Typography>

      {error && <Alert severity='error' sx={{ mt: 2 }}>{error}</Alert>}

      {loading && changes.length === 0 ? (
        <Stack spacing={1} sx={{ mt: 2 }} aria-busy='true' aria-label='Loading changes'>
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} variant='rounded' height='2rem' />
          ))}
        </Stack>
      ) : changes.length === 0 ? (
        !error && (
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            No changes recorded yet. Each refresh compares a week&apos;s tab with the last one.
          </Typography>
        )
      ) : (
        days.map(({ day, changes: dayChanges }) => (
          <Box key={day} sx={{ mt: 2 }}>
            <Typography variant='subtitle2' component='h4' color='text.secondary'>
              {day}
            </Typography>
            <Box
              component='ul'
              sx={(theme) => ({ ...softInset(theme), listStyle: 'none', m: 0, mt: 1, p: 1, borderRadius: 4 })}
            >
              {dayChanges.map((change) => {
                const job = changeJob(change);
                return (
                  <Box component='li' key={change._id}>
                    <Button
                      onClick={() => onSelectWeek(change.weekEnding)}
                      sx={[
                        softPressSx,
                        {
                          display: 'block',
                          width: 1,
                          textAlign: 'left',
                          textTransform: 'none',
                          color: 'text.primary',
                          typography: 'body2',
                          px: 1.5,
                          py: 1,
                          borderRadius: 3,
                        },
                      ]}
                    >
                      <Box component='span' sx={{ color: 'text.secondary' }}>
                        {dayjs(change.seenAt).format('h:mm A')} · W/E {formatWeekEnding(change.weekEnding)} ·{' '}
                      </Box>
                      {job && (
                        <>
                          <strong>{job}</strong> ·{' '}
                        </>
                      )}
                      {describeCoverJobChange(change)}
                      {isNew(change) && (
                        <Chip label='New' color='primary' size='small' component='span' sx={{ ml: 1, verticalAlign: 'middle' }} />
                      )}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))
      )}

      {(hiddenLoaded || more) && (
        <Button
          onClick={showMore}
          disabled={loading}
          sx={[softRaisedSmall, softPressSx, { mt: 2, px: 3, minHeight: '2.5rem' }]}
        >
          {loading ? 'Loading…' : hiddenLoaded ? 'Show all' : 'Show older'}
        </Button>
      )}
    </Box>
  );
}
