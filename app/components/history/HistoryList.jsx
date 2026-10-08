'use client';

import Link from 'next/link';
import dayjs from 'dayjs';
import { MoreVert } from '@mui/icons-material';
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
} from '@mui/material';

import { softInset } from '../utility/soft';

// "Today", "Yesterday", "Mon, Sep 29" (UI-SUGGESTIONS.md #46), in the phone's
// own time zone, which is why the page renders this behind a HydrationGuard.
function dayLabel(date) {
  const day = dayjs(date).startOf('day');
  const today = dayjs().startOf('day');
  if (day.isSame(today)) return 'Today';
  if (day.isSame(today.subtract(1, 'day'))) return 'Yesterday';
  return day.format(day.year() === today.year() ? 'ddd, MMM D' : 'ddd, MMM D, YYYY');
}

// The row's headline matches the lookup card (#40): centers by their alpha
// code, customers by their name. A SLIC that no longer exists shows its number.
function headline(view) {
  if (!view.slic) return `SLIC ${view.numSlic}`;
  if (view.slic.type === 'customer') return view.slic.name || view.slic.alphaSlic;
  return view.slic.alphaSlic;
}

// Swap every `minHeight` in a toolbar mixin for `top`, keeping its media
// queries, so the offset tracks the toolbar's real height (56/48/64px).
const belowToolbar = (mixin) =>
  Object.fromEntries(
    Object.entries(mixin).map(([key, value]) =>
      key === 'minHeight'
        ? ['top', value]
        : [key, typeof value === 'object' ? belowToolbar(value) : value],
    ),
  );

// Each day's header sticks under the fixed app header while that day's rows
// scroll past, then the next day pushes it out (it's sticky within its own
// <ul>). It needs the panel's opaque surface (the page's own color, the
// panel being seamless) so rows don't show through.
const stickyDaySx = (theme) => ({
  ...belowToolbar(theme.mixins.toolbar),
  bgcolor: 'background.default',
  backgroundImage: 'none',
  typography: 'subtitle2',
  lineHeight: 2.5,
  px: 1,
});

// A day's rows sit in a well pressed into the panel (utility/soft.js), flat
// rows with dividers rather than a card per lookup. It clips the rows'
// hover and ripple to its corners; the sticky header is outside it.
const dayWellSx = [softInset, { borderRadius: 4, overflow: 'hidden', mb: 2 }];

function groupByDay(views) {
  const groups = [];
  for (const view of views) {
    const label = dayLabel(view.viewedAt);
    const last = groups.at(-1);
    if (last?.label === label) last.views.push(view);
    else groups.push({ label, views: [view] });
  }
  return groups;
}

// Each row opens that SLIC again on /home; the ⋮ button opens the row menu
// (note, remove), which HistoryView owns.
export default function HistoryList({ views, onOpenMenu }) {
  return (
    <List sx={{ width: '100%' }} disablePadding>
      {groupByDay(views).map(({ label, views: dayViews }) => (
        <li key={label}>
          <Box component='ul' sx={{ p: 0 }}>
            <ListSubheader sx={stickyDaySx}>{label}</ListSubheader>
            <li>
              <List disablePadding sx={dayWellSx}>
                {dayViews.map((view, index) => {
                  const title = headline(view);
                  const subline = [
                    view.slic ? `SLIC ${view.numSlic}` : null,
                    dayjs(view.viewedAt).format('h:mm A'),
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return [
                    index > 0 && (
                      <Divider key={`${view.id}-divider`} component='li' />
                    ),
                    <ListItem
                      key={view.id}
                      disablePadding
                      secondaryAction={
                        <IconButton
                          edge='end'
                          aria-label={`Options for ${title}`}
                          aria-haspopup='menu'
                          onClick={(event) =>
                            onOpenMenu(event.currentTarget, view)
                          }
                          sx={{ width: '3rem', height: '3rem' }}
                        >
                          <MoreVert />
                        </IconButton>
                      }
                    >
                      <ListItemButton
                        component={Link}
                        href={`/home?slic=${encodeURIComponent(view.numSlic)}`}
                        sx={{ minHeight: '3.5rem', pr: 7 }}
                      >
                        <ListItemText
                          primary={title}
                          slotProps={{
                            primary: { sx: { fontWeight: 700 } },
                            secondary: { component: 'div' },
                          }}
                          secondary={
                            <>
                              {subline}
                              {view.note && (
                                <Box
                                  component='span'
                                  sx={{
                                    display: 'block',
                                    fontStyle: 'italic',
                                    color: 'text.primary',
                                    overflowWrap: 'anywhere',
                                    mt: 0.5,
                                  }}
                                >
                                  {view.note}
                                </Box>
                              )}
                            </>
                          }
                        />
                      </ListItemButton>
                    </ListItem>,
                  ];
                })}
              </List>
            </li>
          </Box>
        </li>
      ))}
    </List>
  );
}
