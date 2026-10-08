import { Box, Typography } from '@mui/material';
import parse, { domToReact } from 'html-react-parser';

// A comment's body, in either format. Tips are plain text since 2026-10-07
// (`format: 'text'`, rendered as-is with its line breaks). Older comments are
// Tiptap HTML and keep rendering as HTML, styled by `.comment-content` in
// app/globals.css. Used by the home tips, the profile page and admin.
export default function CommentContent({ comment, variant = 'body1' }) {
  if (comment.format === 'text') {
    return (
      <Typography
        variant={variant}
        sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
      >
        {comment.content}
      </Typography>
    );
  }

  return (
    <Box className='comment-content' sx={{ overflowWrap: 'anywhere' }}>
      {parse(comment.content || '', {
        replace: (domNode) => {
          if (domNode.name === 'p') {
            return (
              <Typography variant={variant}>{domToReact(domNode.children)}</Typography>
            );
          }
        },
      })}
    </Box>
  );
}

// The editable plain text of a comment. An old HTML comment is flattened, with
// paragraphs, line breaks and list items kept as line breaks. Browser-only
// (DOMParser); it's called when the edit box opens.
export function commentToText(comment) {
  if (comment.format === 'text') return comment.content;
  const html = (comment.content || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h[1-6]|blockquote|pre)>/gi, '\n');
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent;
  return text.replace(/\n{3,}/g, '\n\n').trim();
}
