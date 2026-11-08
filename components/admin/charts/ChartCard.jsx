'use client';

import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';

import theme from '@/theme';
import { softInset, softRaised, softToggleSx } from '@/components/utility/soft';

// The admin charts' shared pieces (the super admin hub's usage charts, Cover
// History), following the `dataviz` skill: recessive axes, a solid hairline
// grid, a tooltip on each mark, and a Table toggle on every chart for when a
// tooltip isn't enough.

// The scheme the page shows: a chart's SVG colors can't follow the CSS
// variables the rest of the theme uses.
function useScheme() {
  const { mode, systemMode } = useColorScheme();
  return (mode === 'system' ? systemMode : mode) === 'dark' ? 'dark' : 'light';
}

// One series: the scheme's own primary (both pass 3:1 on the surface).
export function useSeriesColor() {
  return theme.colorSchemes[useScheme()].palette.primary.main;
}

// Two series (a stacked part and the rest): the primary, then an orange
// stepped per scheme. Validated with the dataviz skill's
// validate_palette.js on 2026-11-07 against each scheme's surface (#edf3fc,
// #15181c): every check passes, contrast >= 3:1 included.
const SECOND_SERIES = { light: '#d4581f', dark: '#d95926' };

export function useSeriesColors() {
  const scheme = useScheme();
  return [theme.colorSchemes[scheme].palette.primary.main, SECOND_SERIES[scheme]];
}

export const chartSx = {
  // Recessive axes: no lines or ticks, secondary text.
  '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { display: 'none' },
  '& .MuiChartsAxis-tickLabel': { fill: 'var(--mui-palette-text-secondary)' },
  '& .MuiChartsGrid-line': { stroke: 'var(--mui-palette-divider)', strokeDasharray: 'none' },
  '& .MuiChartsLegend-label': { color: 'var(--mui-palette-text-secondary)' },
};

// A raised card: the title and a one-line summary, the Table toggle, and the
// chart (or its table) in an inset well. `headingComponent` is the title's
// level on the page.
export default function ChartCard({ id, title, summary, chart, table, headingComponent = 'h4' }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Box
      component='section'
      aria-labelledby={id}
      sx={[
        softRaised,
        {
          m: 0,
          borderRadius: 4,
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          minWidth: 0,
        },
      ]}
    >
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography id={id} component={headingComponent} sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {summary}
          </Typography>
        </Box>
        <Button
          aria-pressed={showTable}
          onClick={() => setShowTable((value) => !value)}
          sx={[softToggleSx, { minHeight: '2.75rem', px: 2, flexShrink: 0 }]}
        >
          Table
        </Button>
      </Box>
      <Box sx={[softInset, { borderRadius: 3, p: 1, minWidth: 0 }]}>
        {showTable ? (
          <Box sx={{ maxHeight: '17rem', overflowY: 'auto' }}>{table}</Box>
        ) : (
          chart
        )}
      </Box>
    </Box>
  );
}
