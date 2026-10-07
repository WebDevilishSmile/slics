'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { ClearOutlined, SearchOutlined, SwapVertOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Date ranges, all computed in the browser so "Today" is the driver's day.
// `from`/`to` go to the API as ISO instants; `to` is exclusive.
const RANGES = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today', from: () => dayjs().startOf('day') },
  { key: '7d', label: '7 days', from: () => dayjs().subtract(7, 'day') },
  { key: '30d', label: '30 days', from: () => dayjs().subtract(30, 'day') },
  { key: '6m', label: '6 months', from: () => dayjs().subtract(6, 'month') },
  { key: 'custom', label: 'Custom' },
];

const TYPES = [
  { key: 'center', label: 'Centers' },
  { key: 'customer', label: 'Customers' },
];

// `params` is the page's URL state: q, range, from, to, type, notes, sort.
// `onChange` takes the keys to change (null removes one).
export default function HistoryFilters({ params, onChange }) {
  const [query, setQuery] = useState(params.q || '');
  const range = params.range || 'all';

  // Debounce the search so each keystroke doesn't fetch.
  useEffect(() => {
    if (query.trim() === (params.q || '')) return undefined;
    const timer = setTimeout(() => onChange({ q: query.trim() || null }), 300);
    return () => clearTimeout(timer);
  }, [query, params.q, onChange]);

  const chooseRange = (key) => {
    const preset = RANGES.find((r) => r.key === key);
    if (key === 'custom') {
      // Start the custom range at the last 7 days; the pickers adjust it.
      onChange({
        range: 'custom',
        from: dayjs().subtract(6, 'day').startOf('day').toISOString(),
        to: dayjs().add(1, 'day').startOf('day').toISOString(),
      });
      return;
    }
    onChange({
      range: key === 'all' ? null : key,
      from: preset.from ? preset.from().toISOString() : null,
      to: null,
    });
  };

  const customFrom = params.from ? dayjs(params.from) : null;
  // `to` is the exclusive end, so the picker shows the day before it.
  const customTo = params.to ? dayjs(params.to).subtract(1, 'day') : null;

  const filtered = Boolean(
    params.q || params.range || params.type || params.notes,
  );

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <TextField
        fullWidth
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder='SLIC, name, address or note'
        aria-label='Search your history'
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <SearchOutlined />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position='end'>
                <IconButton
                  aria-label='Clear search'
                  edge='end'
                  onClick={() => {
                    setQuery('');
                    onChange({ q: null });
                  }}
                >
                  <ClearOutlined />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />

      <Box
        role='group'
        aria-label='Date range'
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
      >
        {RANGES.map(({ key, label }) => (
          <Chip
            key={key}
            size='medium'
            label={label}
            clickable
            color={range === key ? 'primary' : 'default'}
            variant={range === key ? 'filled' : 'outlined'}
            aria-pressed={range === key}
            onClick={() => chooseRange(key)}
          />
        ))}
      </Box>

      {range === 'custom' && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <DatePicker
            label='From'
            value={customFrom}
            maxDate={customTo || undefined}
            disableFuture
            onChange={(value) =>
              value?.isValid() &&
              onChange({ from: value.startOf('day').toISOString() })
            }
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
          <DatePicker
            label='To'
            value={customTo}
            minDate={customFrom || undefined}
            disableFuture
            onChange={(value) =>
              value?.isValid() &&
              onChange({ to: value.add(1, 'day').startOf('day').toISOString() })
            }
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {TYPES.map(({ key, label }) => (
          <Chip
            key={key}
            size='medium'
            label={label}
            clickable
            color={params.type === key ? 'primary' : 'default'}
            variant={params.type === key ? 'filled' : 'outlined'}
            aria-pressed={params.type === key}
            onClick={() => onChange({ type: params.type === key ? null : key })}
          />
        ))}
        <Chip
          size='medium'
          label='With notes'
          clickable
          color={params.notes ? 'primary' : 'default'}
          variant={params.notes ? 'filled' : 'outlined'}
          aria-pressed={Boolean(params.notes)}
          onClick={() => onChange({ notes: params.notes ? null : '1' })}
        />
        <Button
          size='small'
          startIcon={<SwapVertOutlined />}
          onClick={() =>
            onChange({ sort: params.sort === 'oldest' ? null : 'oldest' })
          }
          sx={{ ml: 'auto' }}
        >
          {params.sort === 'oldest' ? 'Oldest first' : 'Newest first'}
        </Button>
      </Box>

      {filtered && (
        <Button
          size='small'
          onClick={() => {
            setQuery('');
            onChange({
              q: null,
              range: null,
              from: null,
              to: null,
              type: null,
              notes: null,
            });
          }}
          sx={{ alignSelf: 'flex-start' }}
        >
          Clear filters
        </Button>
      )}
    </Box>
  );
}
