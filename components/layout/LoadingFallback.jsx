'use client';

import { Box, Paper, Skeleton } from '@mui/material';

import { softRaised } from '@/components/utility/soft';
import PageContainer from './PageContainer';

// The generic page skeleton (UI-SUGGESTIONS.md #43): a title bar and a panel
// with a few soft content blocks, in place of the old "Loading..." heading and
// spinner. Route loaders (app/loading.jsx, covers/, admin/cover/drivers/) and
// Suspense fallbacks render it; a screen with a known shape should get its own
// (home/SlicCardSkeleton.jsx).
function LoadingFallback() {
  return (
    <PageContainer>
      <Skeleton
        variant='text'
        sx={{ typography: 'sectionHeading', width: '12rem', maxWidth: '60%' }}
      />
      <Paper
        variant='panel'
        aria-busy='true'
        aria-label='Loading'
        sx={{ alignItems: 'stretch', gap: 2.5 }}
      >
        {[0, 1, 2].map((block) => (
          <Box key={block} sx={[softRaised, { borderRadius: 4, p: 2 }]}>
            <Skeleton variant='text' sx={{ width: '40%' }} />
            <Skeleton variant='text' />
            <Skeleton variant='text' sx={{ width: '80%' }} />
          </Box>
        ))}
      </Paper>
    </PageContainer>
  );
}

export default LoadingFallback;
