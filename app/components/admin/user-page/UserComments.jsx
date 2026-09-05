'use client';

import { useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import CommentHeader from '@/app/components/profile/CommentHeader';
import CommentBody from '@/app/components/profile/CommentBody';
import CommentFoot from '@/app/components/profile/CommentFoot';
import CommentDelete from '@/app/components/profile/CommentDelete';
import { CommentRefreshProvider } from '@/app/context/CommentRefreshContext';
import { serializeComment } from '@/utils/functions';
import { ELEVATION, MAX_WIDTH } from '@/utils/variables';

const PAGE_SIZE = 3;

export default function UserComments({ userComments, user }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleComments = userComments.slice(0, visibleCount);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: MAX_WIDTH,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mt: '1rem',
        px: 2,
      }}
    >
      <Typography variant='h6' sx={{ mt: 2, mb: 1 }}>
        Comments by {user.name}:
      </Typography>

      {userComments.length > 0 ? (
        <CommentRefreshProvider>
          <>
            {visibleComments.map((comment) => {
              const serialized = serializeComment(comment);
              return (
                <Paper
                  key={serialized._id}
                  elevation={ELEVATION}
                  sx={{
                    maxWidth: MAX_WIDTH,
                    width: '100%',
                    mt: 2,
                    p: 2,
                    borderRadius: '8px',
                    boxShadow: 1,
                  }}
                >
                  <CommentHeader comment={serialized} />
                  <CommentBody comment={serialized} />
                  <CommentFoot comment={serialized} />
                  <CommentDelete comment={serialized} />
                </Paper>
              );
            })}

            <Box>
              {visibleCount < userComments.length && (
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
        </CommentRefreshProvider>
      ) : (
        <Typography variant='body2'>
          No comments found for this user.
        </Typography>
      )}
    </Box>
  );
}
