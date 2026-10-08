'use client';

import Link from 'next/link';
import dayjs from 'dayjs';
import {
  OpenInNew,
  ThumbDownOutlined,
  ThumbUpOutlined,
} from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

import CommentContent from '../comments/CommentContent';
import CommentPin from '../comments/CommentPin';
import { softPressSx, softRaised, softRaisedSmall } from '../utility/soft';
import CommentDelete from './CommentDelete';

// One of a driver's tips, listed on their profile and on the admin user page:
// a soft raised card (utility/soft.js) like a tip on /home, with the SLIC it
// belongs to, a link back to it, the tip and its pin, its date and votes,
// and delete.
// `comment` is serialized (lib/serializers.js serializeComment). `index`
// staggers the entry fade.
function CommentCard({ comment, index = 0 }) {
  const posted = dayjs(comment.created_at);
  const up = comment.upVotes?.length || 0;
  const down = comment.downVotes?.length || 0;

  return (
    <Box
      className='enter'
      style={{ '--i': index }}
      sx={[softRaised, { borderRadius: 3, p: 2, pb: 1 }]}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant='subtitle1' component='h3' sx={{ fontWeight: 700 }}>
            SLIC {comment.numSlic}
          </Typography>
          <Typography
            variant='caption'
            color='text.secondary'
            component='time'
            dateTime={posted.toISOString()}
          >
            {comment.parentId ? 'Reply · ' : ''}
            {posted.format('MMM D, YYYY · h:mm A')}
          </Typography>
        </Box>
        <Button
          size='small'
          component={Link}
          href={`/home?slic=${encodeURIComponent(comment.numSlic)}`}
          endIcon={<OpenInNew sx={{ fontSize: '1rem !important' }} />}
          sx={[softRaisedSmall, softPressSx, { px: 1.5, minHeight: '2.5rem' }]}
        >
          View SLIC
        </Button>
      </Box>

      <Box sx={{ mt: 1.5 }}>
        {/* A tip can be just a pin. */}
        {comment.content && <CommentContent comment={comment} />}
        {comment.pin && (
          <CommentPin pin={comment.pin} sx={comment.content ? { mt: 1 } : undefined} />
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mt: 1,
          color: 'text.secondary',
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          aria-label={`${up} found this helpful`}
          role='img'
        >
          <ThumbUpOutlined sx={{ fontSize: '1.1rem' }} />
          <Typography variant='body2'>{up}</Typography>
        </Box>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          aria-label={`${down} found this not helpful`}
          role='img'
        >
          <ThumbDownOutlined sx={{ fontSize: '1.1rem' }} />
          <Typography variant='body2'>{down}</Typography>
        </Box>
        <Box sx={{ ml: 'auto', mr: -1 }}>
          <CommentDelete comment={comment} />
        </Box>
      </Box>
    </Box>
  );
}

export default CommentCard;
