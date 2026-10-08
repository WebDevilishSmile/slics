'use client';

import { useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import CommentCard from '@/components/comments/CommentCard';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';
import { CommentRefreshProvider } from '@/app/context/CommentRefreshContext';
import { serializeComment } from '@/lib/serializers';

const pillSx = [softRaisedSmall, softPressSx, { px: 2 }];

const PAGE_SIZE = 3;

// The driver's tips on the admin user page, in a panel like "SLICs pulled up"
// (UserSlics) above it, three at a time.
export default function UserComments({ userComments }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleComments = userComments.slice(0, visibleCount);

  return (
    <Paper
      variant='panel'
      sx={{ minHeight: 0, alignItems: 'stretch', px: { xs: 2, sm: 3 } }}
    >
      <Typography variant='h6' sx={{ mb: 1, textAlign: 'center' }}>
        Tips ({userComments.length})
      </Typography>

      {userComments.length > 0 ? (
        <CommentRefreshProvider>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              mt: 2,
            }}
          >
            {visibleComments.map((comment, index) => {
              const serialized = serializeComment(comment);
              return (
                <CommentCard
                  key={serialized._id}
                  comment={serialized}
                  index={index}
                />
              );
            })}

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
              {visibleCount < userComments.length && (
                <Button
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  sx={pillSx}
                >
                  See more
                </Button>
              )}
              {visibleCount > PAGE_SIZE && (
                <Button
                  onClick={() => setVisibleCount((count) => count - PAGE_SIZE)}
                  sx={pillSx}
                >
                  See less
                </Button>
              )}
            </Box>
          </Box>
        </CommentRefreshProvider>
      ) : (
        <Typography variant='body2' sx={{ textAlign: 'center' }}>
          No tips yet.
        </Typography>
      )}
    </Paper>
  );
}
