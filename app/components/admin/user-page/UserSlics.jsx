'use client';

import { useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import LocalDate from '@/app/components/layout/LocalDate';
import { softInset, softPressSx, softRaisedSmall } from '../../utility/soft';

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
    <Paper
      variant='panel'
      sx={{ minHeight: 0, alignItems: 'stretch', px: { xs: 2, sm: 3 } }}
    >
      <Typography variant='h6' sx={{ mb: 1, textAlign: 'center' }}>
        SLICs pulled up ({userSlicViews.length})
      </Typography>

      {months.length > 0 ? (
        <>
          <Box sx={{ width: '100%' }}>
            {months.map((month) => (
              <Box key={month} sx={{ mb: 3 }}>
                <Typography
                  variant='subtitle1'
                  sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}
                >
                  {month}
                </Typography>
                <Box
                  sx={[
                    softInset,
                    {
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    },
                  ]}
                >
                  {grouped[month].map((view) => (
                    <Box
                      key={view._id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 2,
                        py: 0.8,
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
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            {visibleCount < userSlicViews.length && (
              <Button
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                sx={[softRaisedSmall, softPressSx, { px: 2 }]}
              >
                See more
              </Button>
            )}
            {visibleCount > PAGE_SIZE && (
              <Button
                onClick={() => setVisibleCount((count) => count - PAGE_SIZE)}
                sx={[softRaisedSmall, softPressSx, { px: 2 }]}
              >
                See less
              </Button>
            )}
          </Box>
        </>
      ) : (
        <Typography variant='body2' sx={{ textAlign: 'center' }}>
          No SLIC lookups found for this user.
        </Typography>
      )}
    </Paper>
  );
}
