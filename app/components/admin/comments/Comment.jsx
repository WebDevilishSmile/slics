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
import parse, { domToReact } from 'html-react-parser';

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

        <Box sx={{ mt: '1rem' }}>
          {/* COMMENT CONTENT */}

          {parse(comment.content, {
            replace: (domNode) => {
              if (domNode.name === 'p') {
                return (
                  <Typography variant='body2'>
                    {domToReact(domNode.children)}
                  </Typography>
                );
              }
            },
          })}
        </Box>

        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            mt: '1rem',
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
