'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from '@mui/material';

import { softInset, softPressSx, softRaisedSmall, softToggleSx } from '@/components/utility/soft';
import { CHANGE_GROUPS, describeJobChange } from './jobChangeText';

async function fetchChanges({ group, last }) {
  const params = new URLSearchParams();
  if (group) params.set('group', group);
  if (last) {
    params.set('before', last.seenAt);
    params.set('beforeId', last._id);
  }
  const res = await fetch(`/api/sheet-jobs/changes?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't load the changes.");
  return data.data;
}

// Changes to the Jobs tab, newest first and grouped by day, with filter chips.
// The "All" first page (`initial`, `initialMore`) comes from the server page,
// so a refresh shows up at once; filters and older pages come from
// GET /api/sheet-jobs/changes. `onOpenJob(jobName)` opens that job.
export default function JobChangesFeed({ initial, initialMore, onOpenJob }) {
  const [group, setGroup] = useState(null);
  // What was fetched on top of the server's page: older "All" pages, or a
  // filter's own list. Reset whenever the server sends a new first page.
  const [fetched, setFetched] = useState({ group: null, changes: [], more: initialMore });
  const [shownInitial, setShownInitial] = useState(initial);
  if (initial !== shownInitial) {
    setShownInitial(initial);
    setFetched({ group: null, changes: [], more: initialMore });
    setGroup(null);
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const changes = group === null ? [...initial, ...fetched.changes] : fetched.changes;
  const more = fetched.group === group ? fetched.more : false;

  async function run(task) {
    setLoading(true);
    setError('');
    try {
      await task();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const choose = (value) => {
    setGroup(value);
    if (value === null) {
      setFetched({ group: null, changes: [], more: initialMore });
      return;
    }
    setFetched({ group: value, changes: [], more: false });
    run(async () => {
      const data = await fetchChanges({ group: value });
      setFetched({ group: value, changes: data.changes, more: data.more });
    });
  };

  const loadOlder = () =>
    run(async () => {
      const data = await fetchChanges({ group, last: changes.at(-1) });
      setFetched((previous) => ({
        group,
        changes: [...previous.changes, ...data.changes],
        more: data.more,
      }));
    });

  const days = [];
  for (const change of changes) {
    const day = dayjs(change.seenAt).format('dddd, MMM D');
    if (days.at(-1)?.day !== day) days.push({ day, changes: [] });
    days.at(-1).changes.push(change);
  }

  return (
    <Box component='section' aria-labelledby='job-changes-heading'>
      <Typography id='job-changes-heading' variant='h6' component='h3'>
        Changes
      </Typography>

      <Box
        role='group'
        aria-label='Show changes to'
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}
      >
        {CHANGE_GROUPS.map((option) => (
          <Chip
            key={option.label}
            label={option.label}
            clickable
            aria-pressed={group === option.value}
            onClick={() => choose(option.value)}
            sx={softToggleSx}
          />
        ))}
      </Box>

      {error && <Alert severity='error' sx={{ mt: 2 }}>{error}</Alert>}

      {loading && changes.length === 0 ? (
        <Stack spacing={1} sx={{ mt: 2 }} aria-busy='true' aria-label='Loading changes'>
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} variant='rounded' height='2rem' />
          ))}
        </Stack>
      ) : changes.length === 0 ? (
        <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
          {group === null
            ? 'No changes recorded yet. Each refresh compares the sheet with the last one.'
            : 'No changes of this kind yet.'}
        </Typography>
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
              {dayChanges.map((change) => (
                <Box component='li' key={change._id}>
                  <Button
                    onClick={() => onOpenJob(change.jobName)}
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
                      {dayjs(change.seenAt).format('h:mm A')} ·{' '}
                    </Box>
                    <strong>{change.jobName}</strong> · {describeJobChange(change)}
                  </Button>
                </Box>
              ))}
            </Box>
          </Box>
        ))
      )}

      {more && (
        <Button
          onClick={loadOlder}
          disabled={loading}
          sx={[softRaisedSmall, softPressSx, { mt: 2, px: 3, minHeight: '2.5rem' }]}
        >
          {loading ? 'Loading…' : 'Show older'}
        </Button>
      )}
    </Box>
  );
}
