'use client';

import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import CommentCard from '@/app/components/profile/CommentCard';
import { softPressSx, softRaisedSmall } from '@/app/components/utility/soft';
import { CommentRefreshProvider } from '@/app/context/CommentRefreshContext';
import { serializeComment } from '@/lib/serializers';
import theme from '@/theme';

const pillSx = [softRaisedSmall, softPressSx, { px: 2 }];

const PAGE_SIZE = 3;

export default function UserComments({ userComments, user }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleComments = userComments.slice(0, visibleCount);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: theme.layout.width.panel,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mt: 2,
        px: 2,
      }}
    >
      <Typography variant='h6' sx={{ mt: 2, mb: 1 }}>
        Comments by {user.name}:
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
        <Typography variant='body2'>
          No comments found for this user.
        </Typography>
      )}
    </Box>
  );
}
