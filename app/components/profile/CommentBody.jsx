import { Box, Typography } from '@mui/material';
import parse, { domToReact } from 'html-react-parser';

function CommentBody({ comment }) {
  return (
    <Box sx={{ minHeight: '5rem', py: '1rem', px: '1rem' }}>
      {/* COMMENT CONTENT */}

      {parse(comment.content, {
        replace: (domNode) => {
          if (domNode.name === 'p') {
            return <Typography>{domToReact(domNode.children)}</Typography>;
          }
        },
      })}
    </Box>
  );
}

export default CommentBody;
