'use client';

import Link from 'next/link';
import dayjs from 'dayjs';
import {
  OpenInNew,
  ThumbDownOutlined,
  ThumbUpOutlined,
} from '@mui/icons-material';
import { Avatar, Box, Button, Typography } from '@mui/material';

import { softPressSx, softRaised, softRaisedSmall } from '@/components/utility/soft';
import CommentContent from './CommentContent';
import CommentDelete from './CommentDelete';
import CommentPin from './CommentPin';

// A tip shown outside its SLIC, in a list: a driver's own tips on their
// profile, a driver's tips on the admin user page, and every tip on
// /admin/comments. A soft raised card (utility/soft.js) like a tip on /home,
// with the SLIC it belongs to, a link back to it, the tip and its pin, its
// date and votes, and delete. The interactive version, with voting and
// replies, is Comment.jsx on /home.
// - `comment` is serialized (lib/serializers.js serializeComment).
// - `slicName` follows the SLIC number when given (/admin/comments).
// - `author` ({ name, image }) shows who posted it, for lists of many drivers.
// - `canDelete` shows the delete button, which needs a CommentRefreshProvider
//   around the list.
// - `index` staggers the entry fade.
function CommentCard({ comment, slicName, author, canDelete = true, index = 0 }) {
  const posted = dayjs(comment.created_at);
  const up = comment.upVotes?.length || 0;
  const down = comment.downVotes?.length || 0;
  // The delete button's 40px row sets the bottom edge; without it, match the sides.
  const bottom = canDelete ? 1 : 2;

  return (
    <Box
      className='enter'
      style={{ '--i': index }}
      sx={[softRaised, { borderRadius: 3, p: 2, pb: bottom }]}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant='subtitle1' component='h3' sx={{ fontWeight: 700 }}>
            SLIC {comment.numSlic}
            {slicName ? ` · ${slicName}` : ''}
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
        {/* Who posted it sits where a driver's own card has delete. */}
        {author && (
          <Box
            sx={{
              ml: 'auto',
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant='caption' noWrap>
              {author.name || 'Deleted account'}
            </Typography>
            <Avatar src={author.image} alt='' sx={{ width: '1.75rem', height: '1.75rem' }} />
          </Box>
        )}
        {canDelete && (
          <Box sx={{ ml: author ? 0 : 'auto', mr: -1 }}>
            <CommentDelete comment={comment} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default CommentCard;
