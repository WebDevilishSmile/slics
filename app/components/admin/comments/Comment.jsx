import { ExitToApp, Launch } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import CommentContent from '../../comments/CommentContent';

dayjs.extend(require('dayjs/plugin/localizedFormat'));

function Comment({ comment, slic, author }) {
  return (
    <Card>
      <CardContent sx={{ position: 'relative' }}>
        <Button
          sx={{ position: 'absolute', top: 0, right: 0 }}
          href={`/home?slic=${comment.numSlic}`}
        >
          <Launch />
        </Button>
        <Typography>
          SLIC: {comment.numSlic} --{' '}
          {slic.type === 'center' ? slic.alphaSlic : slic.name}
        </Typography>

        <Divider />

        <Box sx={{ mt: 2 }}>
          <CommentContent comment={comment} variant='body2' />
        </Box>

        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            mt: 2,
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
      </CardContent>
    </Card>
  );
}

export default Comment;
