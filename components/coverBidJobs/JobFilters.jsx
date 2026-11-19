'use client';

import { useId, useState } from 'react';
import { Box, Button, Collapse, Typography } from '@mui/material';
import { ArrowDownward, ArrowUpward } from '@mui/icons-material';
import TuneIcon from '@mui/icons-material/Tune';
import { softInset, softPressSx, softRaisedSmall, softToggleSx } from '@/components/utility/soft';
import { DAY_FIELDS, DAY_LABELS } from '@/lib/dayFormat';
import { COVER_SORTS } from '@/lib/coverJobSort';

const toggleSx = [softToggleSx, { minHeight: '2.75rem', px: 2, borderRadius: 999 }];
const dayToggleSx = [softToggleSx, { minHeight: '2.75rem', minWidth: '3.25rem', px: 1, borderRadius: 999 }];

function Group({ label, children }) {
  return (
    <Box role='group' aria-label={label} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant='caption' color='text.secondary' fontWeight={600}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>{children}</Box>
    </Box>
  );
}

// Sort and filter for a week's cover jobs on /covers (CoverBidJobsTable),
// folded behind one button so the jobs stay near the top on a phone. The
// state lives in the table, which applies it (lib/coverJobSort.js):
// - `sort`: null (the sheet's order) or { key, direction }; a second tap on
//   the same sort reverses it.
// - `openOnly`: leaves out jobs already picked.
// - `days`: the days a job must work, every one of them.
export default function JobFilters({ sort, onSort, openOnly, onOpenOnly, days, onDays }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const active = (sort ? 1 : 0) + (openOnly ? 1 : 0) + (days.length ? 1 : 0);

  const sortBy = (entry) =>
    onSort(
      sort?.key === entry.key
        ? { key: entry.key, direction: sort.direction === 'asc' ? 'desc' : 'asc' }
        : { key: entry.key, direction: entry.first },
    );
  const toggleDay = (day) =>
    onDays(days.includes(day) ? days.filter((d) => d !== day) : DAY_FIELDS.filter((d) => d === day || days.includes(d)));
  const clear = () => {
    onSort(null);
    onOpenOnly(false);
    onDays([]);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Button
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          startIcon={<TuneIcon />}
          sx={[softRaisedSmall, softPressSx, { minHeight: '2.75rem', px: 2, borderRadius: 999 }]}
        >
          Sort & filter{active > 0 && ` · ${active}`}
        </Button>
        {active > 0 && (
          <Button onClick={clear} sx={[softPressSx, { minHeight: '2.75rem', px: 2, borderRadius: 999 }]}>
            Clear
          </Button>
        )}
      </Box>

      <Collapse in={open} id={panelId}>
        <Box sx={[softInset, { display: 'flex', flexDirection: 'column', gap: 2, p: 2, borderRadius: 4 }]}>
          <Group label='Sort'>
            <Button aria-pressed={!sort} onClick={() => onSort(null)} sx={toggleSx}>
              Sheet order
            </Button>
            {COVER_SORTS.map((entry) => {
              const on = sort?.key === entry.key;
              const Arrow = on && sort.direction === 'desc' ? ArrowDownward : ArrowUpward;
              return (
                <Button
                  key={entry.key}
                  aria-pressed={on}
                  aria-label={on ? `${entry.label}, ${entry.words[sort.direction]}` : entry.label}
                  onClick={() => sortBy(entry)}
                  endIcon={on ? <Arrow fontSize='small' /> : null}
                  sx={toggleSx}
                >
                  {entry.label}
                </Button>
              );
            })}
          </Group>

          <Group label='Show'>
            <Button aria-pressed={openOnly} onClick={() => onOpenOnly(!openOnly)} sx={toggleSx}>
              Open jobs only
            </Button>
          </Group>

          <Group label='Works on every day picked'>
            {DAY_FIELDS.map((day) => (
              <Button key={day} aria-pressed={days.includes(day)} onClick={() => toggleDay(day)} sx={dayToggleSx}>
                {DAY_LABELS[day]}
              </Button>
            ))}
          </Group>
        </Box>
      </Collapse>
    </Box>
  );
}
