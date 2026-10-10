import { Typography } from '@mui/material';
import { htmlToText } from '@/lib/commentText';

// A comment's body, always rendered as text with its line breaks. Tips are
// plain text since 2026-10-07 (`format: 'text'`). Older comments were Tiptap
// HTML; scripts/convertHtmlComments.mjs converted them, and any still stored
// as HTML is flattened here, never parsed (docs/SECURITY.md #2). Used by the
// home tips, the profile page and admin.
export default function CommentContent({ comment, variant = 'body1' }) {
  return (
    <Typography variant={variant} sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
      {commentToText(comment)}
    </Typography>
  );
}

// The plain text of a comment, for the render and the edit box.
export function commentToText(comment) {
  return comment.format === 'text' ? comment.content : htmlToText(comment.content);
}
