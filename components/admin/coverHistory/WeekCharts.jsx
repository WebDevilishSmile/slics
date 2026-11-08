'use client';

import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography, useMediaQuery } from '@mui/material';

import ChartCard, { chartSx, useSeriesColor, useSeriesColors } from '@/components/admin/charts/ChartCard';
import { shortDate } from '@/components/admin/hub/format';
import { softTableSx } from '@/components/utility/soft';

// Cover History's week-by-week charts (the `dataviz` skill's rules, like the
// super admin hub's): one series is the brand blue with no legend, two are
// stacked with a legend (useSeriesColors). Every chart has its table, and
// tapping a week opens it in "A week up close" (`onWeek`).

const sum = (values) => values.reduce((total, value) => total + (value ?? 0), 0);
const numbers = (values) => values.filter((value) => value !== null && value !== undefined);

function Bars({ weeks, series, onWeek, stacked = false }) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  return (
    <BarChart
      height={220}
      xAxis={[
        {
          scaleType: 'band',
          data: weeks.map((week) => shortDate(week.weekEnding)),
          categoryGapRatio: 0.35,
          // MUI drops labels that would overlap (a phone fits about six).
          tickLabelInterval: 'auto',
        },
      ]}
      yAxis={[{ tickMinStep: 1, width: 36 }]}
      series={series.map((entry) => ({
        ...entry,
        ...(stacked ? { stack: 'total' } : {}),
        valueFormatter: (value) => (value === null || value === undefined ? 'No data' : `${value}`),
      }))}
      grid={{ horizontal: true }}
      borderRadius={4}
      hideLegend={series.length === 1}
      slotProps={{ legend: { position: { vertical: 'top', horizontal: 'start' } } }}
      skipAnimation={reduceMotion}
      margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      onAxisClick={(event, data) => {
        const week = weeks[data?.dataIndex];
        if (week) onWeek(week.weekEnding);
      }}
      sx={[
        chartSx,
        { '& .MuiBarElement-root': { cursor: 'pointer' } },
        // A 2px surface gap between stacked parts.
        stacked && { '& .MuiBarElement-root': { stroke: 'var(--mui-palette-background-default)', strokeWidth: 2 } },
      ]}
    />
  );
}

function WeekTable({ label, weeks, columns }) {
  return (
    <Table size='small' sx={softTableSx} aria-label={label}>
      <TableHead>
        <TableRow>
          <TableCell>Week ending</TableCell>
          {columns.map((column) => (
            <TableCell key={column.label} align='right'>
              {column.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {[...weeks].reverse().map((week) => (
          <TableRow key={week.weekEnding}>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>{shortDate(week.weekEnding)}</TableCell>
            {columns.map((column) => (
              <TableCell key={column.label} align='right' sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {column.value(week) ?? '—'}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const leaveText = (leaves) =>
  Object.entries(leaves)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${count} ${type}`)
    .join(', ') || null;

export default function WeekCharts({ summaries: weeks, onWeek }) {
  const blue = useSeriesColor();
  const [first, second] = useSeriesColors();
  // The driver charts plot only weeks with a pick list: an upload-era week
  // would be an empty column.
  const picked = weeks.filter((week) => week.hasPicks);
  const pickValue = (field) => picked.map((week) => week[field]);
  const shown = weeks.map((week) => week.shown);
  const listed = weeks.filter((week) => week.lists);
  const depths = numbers(pickValue('deepestPlace'));

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
        gap: { xs: 2, sm: 2.5 },
      }}
    >
      <ChartCard
        id='history-jobs'
        title='Cover jobs per week'
        summary={`About ${Math.round(sum(shown) / Math.max(weeks.length, 1))} a week drivers could see, ${Math.min(...shown)} to ${Math.max(...shown)}`}
        chart={<Bars weeks={weeks} onWeek={onWeek} series={[{ data: shown, label: 'Jobs', color: blue }]} />}
        table={
          <WeekTable
            label='Cover jobs per week'
            weeks={weeks}
            columns={[
              { label: 'Posted', value: (week) => week.posted },
              { label: 'Shown', value: (week) => week.shown },
              { label: 'Taken', value: (week) => week.taken },
              { label: 'Open', value: (week) => week.open },
              { label: 'Hidden', value: (week) => week.hidden.admin + week.hidden.sheet + week.hidden.sleeper },
            ]}
          />
        }
      />
      <ChartCard
        id='history-takers'
        title='Who took the jobs'
        summary={
          picked.length
            ? `${sum(picked.map((week) => week.onCallCovering))} of ${sum(picked.map((week) => week.covering))} covers went to on-call drivers`
            : 'No pick lists saved in these weeks'
        }
        chart={
          <Bars
            weeks={picked}
            onWeek={onWeek}
            stacked
            series={[
              {
                data: picked.map((week) => week.covering - week.onCallCovering),
                label: 'Cover drivers',
                color: first,
              },
              { data: pickValue('onCallCovering'), label: 'On-call drivers', color: second },
            ]}
          />
        }
        table={
          <WeekTable
            label='Who took the jobs'
            weeks={picked}
            columns={[
              { label: 'Cover drivers', value: (week) => week.covering - week.onCallCovering },
              { label: 'On call', value: (week) => week.onCallCovering },
              { label: 'No job', value: (week) => week.coverNoJob },
            ]}
          />
        }
      />
      <ChartCard
        id='history-out'
        title='Drivers out per week'
        summary={picked.length ? `Vacation, FMLA, buyouts and other leaves on the pick list` : 'No pick lists saved in these weeks'}
        chart={<Bars weeks={picked} onWeek={onWeek} series={[{ data: pickValue('out'), label: 'Out', color: blue }]} />}
        table={
          <WeekTable
            label='Drivers out per week'
            weeks={picked}
            columns={[
              { label: 'Out', value: (week) => week.out },
              { label: 'Why', value: (week) => leaveText(week.leaves) },
            ]}
          />
        }
      />
      <ChartCard
        id='history-depth'
        title='How far down the list the jobs went'
        summary={
          depths.length
            ? `The last place that got a cover job: ${Math.min(...depths)} to ${Math.max(...depths)}`
            : 'No pick lists saved in these weeks'
        }
        chart={
          <Bars weeks={picked} onWeek={onWeek} series={[{ data: pickValue('deepestPlace'), label: 'Last place', color: blue }]} />
        }
        table={
          <WeekTable
            label='How far down the list the jobs went'
            weeks={picked}
            columns={[
              { label: 'Last place', value: (week) => week.deepestPlace },
              { label: 'On the list', value: (week) => week.listed },
              { label: 'On call', value: (week) => week.onCall },
            ]}
          />
        }
      />
      <ChartCard
        id='history-changes'
        title='Changes after posting'
        summary={`${sum(weeks.map((week) => week.jobChanges))} job changes and ${sum(weeks.map((week) => week.pickChanges))} pick list changes`}
        chart={
          <Bars
            weeks={weeks}
            onWeek={onWeek}
            stacked
            series={[
              { data: weeks.map((week) => week.jobChanges), label: 'Jobs', color: first },
              { data: weeks.map((week) => week.pickChanges), label: 'Pick list', color: second },
            ]}
          />
        }
        table={
          <WeekTable
            label='Changes after posting'
            weeks={weeks}
            columns={[
              { label: 'Jobs', value: (week) => week.jobChanges },
              { label: 'Pick list', value: (week) => week.pickChanges },
              { label: 'Bid day moved', value: (week) => (week.bidMoved ? 'Yes' : null) },
            ]}
          />
        }
      />
      {listed.length ? (
        <ChartCard
          id='history-lists'
          title='Cover lists per week'
          summary='How many verified drivers kept a list (anonymous totals)'
          chart={
            <Bars
              weeks={weeks}
              onWeek={onWeek}
              series={[{ data: weeks.map((week) => week.lists), label: 'Lists', color: blue }]}
            />
          }
          table={
            <WeekTable label='Cover lists per week' weeks={listed} columns={[{ label: 'Lists', value: (week) => week.lists }]} />
          }
        />
      ) : (
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center' }}>
          <Typography variant='body2' color='text.secondary'>
            Cover lists per week show here once the daily sync has saved their totals. Lists are deleted four
            weeks after their week; the totals stay, without names.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
