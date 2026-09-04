import { Paper, Typography } from '@mui/material';
import parse, { domToReact } from 'html-react-parser';

export default function CommentsPage({ user, comments, slic }) {
  console.log('CommentsPage comments:', comments);
  return (
    <Paper
      sx={{
        p: '1rem',
        width: '100%',
        maxWidth: '600px',
        margin: '2rem auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      elevation={3}
    >
      <Typography variant='h6' textAlign='center'>
        Comments for
      </Typography>
      <Typography variant='h6' sx={{ mb: '1rem' }} textAlign='center'>
        {slic.alphaSlic} / {slic.numSlic}
      </Typography>

      {comments.length > 0 ? (
        comments.map((comment, index) => (
          <Paper
            key={index}
            sx={{
              p: '1rem',
              width: '100%',
              maxWidth: '600px',
              margin: '1rem auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            elevation={0}
          >
            {parse(comment.content, {
              replace: (domNode) => {
                if (domNode.name === 'p') {
                  return (
                    <Typography>{domToReact(domNode.children)}</Typography>
                  );
                }
              },
            })}
          </Paper>
        ))
      ) : (
        <Typography variant='body1' textAlign='center'>
          No comments yet.
        </Typography>
      )}
    </Paper>
  );
}
