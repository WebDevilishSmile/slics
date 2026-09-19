'use client';

import { useState } from 'react';
import { Box, Button, Divider, Typography } from '@mui/material';
import LocalDate from '@/app/components/layout/LocalDate';
import theme from '@/utils/theme';

const PAGE_SIZE = 5;

function getSlicLabel(numSlic, slics) {
  const slic = slics.find((s) => s.numSlic === numSlic);
  if (!slic) return numSlic;
  if (slic.type === 'customer') return `${slic.numSlic} - ${slic.name}`;
  return `${slic.numSlic} - ${slic.alphaSlic}`;
}

function groupByMonth(views) {
  const groups = {};
  for (const view of views) {
    const label = new Date(view.viewedAt).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    if (!groups[label]) groups[label] = [];
    groups[label].push(view);
  }
  return groups;
}

export default function UserSlics({ userSlicViews, slics }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleViews = userSlicViews.slice(0, visibleCount);
  const grouped = groupByMonth(visibleViews);
  const months = Object.keys(grouped);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: theme.layout.maxWidth,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mt: '1rem',
      }}
    >
      <Typography variant='h6' sx={{ mt: 2, mb: 1 }}>
        SLICs pulled up ({userSlicViews.length}) SLICs:
      </Typography>

      {months.length > 0 ? (
        <>
          <Box sx={{ width: '100%', px: 2 }}>
            {months.map((month) => (
              <Box key={month} sx={{ mb: '1.5rem' }}>
                <Typography
                  variant='subtitle1'
                  sx={{ fontWeight: 700, mb: '0.5rem' }}
                >
                  {month}
                </Typography>
                <Divider sx={{ mb: '0.5rem' }} />
                {grouped[month].map((view, i) => (
                  <Box
                    key={view._id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: '0.4rem',
                      borderBottom:
                        i < grouped[month].length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant='body2'>
                      {getSlicLabel(view.numSlic, slics)}
                    </Typography>
                    <Typography
                      variant='body2'
                      sx={{ color: 'text.secondary' }}
                    >
                      <LocalDate date={view.viewedAt} />
                    </Typography>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>

          <Box>
            {visibleCount < userSlicViews.length && (
              <Button
                variant='outlined'
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                sx={{ mb: 2 }}
              >
                See more
              </Button>
            )}
            {visibleCount > PAGE_SIZE && (
              <Button
                variant='outlined'
                onClick={() => setVisibleCount((count) => count - PAGE_SIZE)}
                sx={{ mb: 2, ml: 2 }}
              >
                See less
              </Button>
            )}
          </Box>
        </>
      ) : (
        <Typography variant='body2'>
          No SLIC lookups found for this user.
        </Typography>
      )}
    </Box>
  );
}
