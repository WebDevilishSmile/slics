import { Launch } from '@mui/icons-material';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import dayjs from 'dayjs';
import CommentContent from '../../comments/CommentContent';
import CommentPin from '../../comments/CommentPin';
import { softInset, softPressSx, softRaised } from '../../utility/soft';

dayjs.extend(require('dayjs/plugin/localizedFormat'));

function Comment({ comment, slic, author }) {
  return (
    <Box sx={[softRaised, { position: 'relative', borderRadius: 3, p: 2.5 }]}>
      <IconButton
        aria-label={`See SLIC ${comment.numSlic}`}
        sx={[softPressSx, { position: 'absolute', top: 8, right: 8 }]}
        href={`/home?slic=${comment.numSlic}`}
      >
        <Launch color='primary' />
      </IconButton>
      <Typography sx={{ pr: 6, fontWeight: 600 }}>
        SLIC: {comment.numSlic} --{' '}
        {slic.type === 'center' ? slic.alphaSlic : slic.name}
      </Typography>

      {/* A tip can be just a pin. */}
      {comment.content && (
        <Box sx={[softInset, { mt: 2, p: 2, borderRadius: 2 }]}>
          <CommentContent comment={comment} variant='body2' />
        </Box>
      )}
      {comment.pin && <CommentPin pin={comment.pin} sx={{ mt: comment.content ? 1.5 : 2 }} />}

      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          mt: 2,
          pr: 5,
        }}
      >
        <Typography variant='caption'>Posted by {author.name}</Typography>
        <Typography variant='caption'>
          on {dayjs(comment.created_at).format('LLL')}
        </Typography>

        <Avatar
          sx={{
            position: 'absolute',
            right: '0',
            bottom: '0',
            height: '2rem',
            width: '2rem',
          }}
          src={author.image}
        />
      </Box>
    </Box>
  );
}

export default Comment;
