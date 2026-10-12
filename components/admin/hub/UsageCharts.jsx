'use client';

import { useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';

import theme from '@/theme';
import { softInset, softRaised, softTableSx, softToggleSx } from '@/components/utility/soft';
import { formatCount, plural, shortDate } from './format';

// The hub's usage charts (docs/SUPER-ADMIN-HUB.md stage B), one series each,
// so one brand blue and no legend: the title says what's plotted (the
// `dataviz` skill's rules). Columns with a 4px rounded top, a solid hairline
// grid, a tooltip on each column, and a table view for when a tooltip isn't
// enough. The blue is the scheme's own primary (both pass 3:1 on the surface).

// The scheme the page shows: a chart's SVG colors can't follow the CSS
// variables the rest of the theme uses.
function useSeriesColor() {
  const { mode, systemMode } = useColorScheme();
  const scheme = (mode === 'system' ? systemMode : mode) === 'dark' ? 'dark' : 'light';
  return theme.colorSchemes[scheme].palette.primary.main;
}

const chartSx = {
  // Recessive axes: no lines or ticks, secondary text.
  '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { display: 'none' },
  '& .MuiChartsAxis-tickLabel': { fill: 'var(--mui-palette-text-secondary)' },
  '& .MuiChartsGrid-line': { stroke: 'var(--mui-palette-divider)', strokeDasharray: 'none' },
};

function ChartCard({ id, title, summary, chart, table }) {
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
          <Typography id={id} component='h4' sx={{ fontWeight: 700 }}>
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

function CountTable({ label, heading, rows }) {
  return (
    <Table size='small' sx={softTableSx} aria-label={label}>
      <TableHead>
        <TableRow>
          <TableCell>{heading}</TableCell>
          <TableCell align='right'>Count</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell>{row.label}</TableCell>
            <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatCount(row.count)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Columns({ labels, values, seriesLabel, tickLabelInterval = 'auto', unit }) {
  const color = useSeriesColor();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  return (
    <BarChart
      height={220}
      xAxis={[
        {
          scaleType: 'band',
          data: labels,
          categoryGapRatio: 0.35,
          tickLabelInterval,
        },
      ]}
      yAxis={[{ tickMinStep: 1, width: 36 }]}
      series={[
        {
          data: values,
          label: seriesLabel,
          color,
          valueFormatter: (value) => (value === null ? '' : plural(value, unit)),
        },
      ]}
      grid={{ horizontal: true }}
      borderRadius={4}
      hideLegend
      skipAnimation={reduceMotion}
      margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      sx={chartSx}
    />
  );
}

export default function UsageCharts({ usage }) {
  const days = usage.lookupsByDay;
  const weeks = usage.signUpsByWeek;
  const lookupTotal = days.reduce((sum, day) => sum + day.count, 0);
  const signUpTotal = weeks.reduce((sum, week) => sum + week.count, 0);
  const lastDay = days.length - 1;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
        gap: { xs: 2, sm: 2.5 },
      }}
    >
      <ChartCard
        id='usage-lookups'
        title='Lookups per day'
        summary={`${plural(lookupTotal, 'lookup')} in the last 30 days`}
        chart={
          <Columns
            labels={days.map((day) => shortDate(day.date))}
            values={days.map((day) => day.count)}
            seriesLabel='Lookups'
            unit='lookup'
            // A label a week apart, ending on today.
            tickLabelInterval={(value, index) => (lastDay - index) % 7 === 0}
          />
        }
        table={
          <CountTable
            label='Lookups per day'
            heading='Day'
            rows={[...days].reverse().map((day) => ({ key: day.date, label: shortDate(day.date), count: day.count }))}
          />
        }
      />
      <ChartCard
        id='usage-sign-ups'
        title='Sign-ups per week'
        summary={`${plural(signUpTotal, 'new account')} in 12 weeks · weeks end on Saturday`}
        chart={
          <Columns
            labels={weeks.map((week) => shortDate(week.weekEnding))}
            values={weeks.map((week) => week.count)}
            seriesLabel='Sign-ups'
            unit='sign-up'
          />
        }
        table={
          <CountTable
            label='Sign-ups per week'
            heading='Week ending'
            rows={[...weeks]
              .reverse()
              .map((week) => ({ key: week.weekEnding, label: `W/E ${shortDate(week.weekEnding)}`, count: week.count }))}
          />
        }
      />
    </Box>
  );
}
