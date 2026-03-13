import { auth } from '@/auth';
import { ObjectId } from 'mongodb';
import client from '@/lib/db';
import { getAllSlics } from '@/utils/slicsApi';

import HomeButton from '@/app/components/layout/HomeButton';
import RedirectMessage from '@/app/components/layout/RedirectMessage';
import PageContainer from '@/app/components/layout/PageContainer';
import StyledHeading from '@/app/components/layout/StyledHeading';
import { Box, Divider, Paper, Typography } from '@mui/material';
import { ELEVATION, MAX_WIDTH } from '@/utils/variables';
import dayjs from 'dayjs';

async function getViewHistory(userId) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const db = client.db();

  const views = await db
    .collection('slicViews')
    .find({
      userId: new ObjectId(userId),
      viewedAt: { $gte: sixMonthsAgo },
    })
    .sort({ viewedAt: -1 })
    .toArray();

  return views;
}

function groupByMonth(views) {
  const groups = {};
  for (const view of views) {
    const key = dayjs(view.viewedAt).format('MMMM YYYY');
    if (!groups[key]) groups[key] = [];
    groups[key].push(view);
  }
  return groups;
}

function getSlicLabel(numSlic, slics) {
  const slic = slics.find((s) => s.numSlic === numSlic);
  if (!slic) return numSlic;
  if (slic.type === 'customer') return `${slic.numSlic} - ${slic.name}`;
  return `${slic.numSlic} - ${slic.alphaSlic}`;
}

export default async function HistoryPage() {
  const session = await auth();

  console.log(session);

  if (!session) {
    return (
      <RedirectMessage
        heading='You must be signed in to view this page.'
        subheading='Please sign in and try again.'
        redirect='/'
      />
    );
  }

  if (!session.user.bmcMember) {
    return (
      <RedirectMessage
        heading='This page is available to members only.'
        subheading='Support SLICs on Buy Me a Coffee to access your history.'
        redirect='/'
      />
    );
  }

  const [views, slics] = await Promise.all([
    getViewHistory(session.user.id),
    getAllSlics(),
  ]);

  const grouped = groupByMonth(views);
  const months = Object.keys(grouped);

  return (
    <PageContainer>
      <StyledHeading>Slic History</StyledHeading>
      <HomeButton />

      <Paper
        elevation={ELEVATION}
        sx={{
          width: '100%',
          maxWidth: MAX_WIDTH,
          mt: '2rem',
          px: { xs: '1rem', sm: '2rem' },
          py: '2rem',
        }}
      >
        {months.length === 0 ? (
          <Typography
            variant='body1'
            sx={{ textAlign: 'center', color: 'text.secondary' }}
          >
            No slic lookups in the past 6 months. Start searching!
          </Typography>
        ) : (
          months.map((month, i) => (
            <Box key={month} sx={{ mb: '2rem' }}>
              <Typography variant='h6' sx={{ fontWeight: 700, mb: '0.5rem' }}>
                {month}
              </Typography>
              <Divider sx={{ mb: '0.75rem' }} />
              {grouped[month].map((view, j) => (
                <Box
                  key={j}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: '0.4rem',
                    borderBottom:
                      j < grouped[month].length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant='body2'>
                    {getSlicLabel(view.numSlic, slics)}
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    {dayjs(view.viewedAt).format('MMM D, h:mm A')}
                  </Typography>
                </Box>
              ))}
            </Box>
          ))
        )}
      </Paper>
    </PageContainer>
  );
}
