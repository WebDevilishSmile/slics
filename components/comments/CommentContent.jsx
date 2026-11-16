import { PhoneOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

import { htmlToText } from '@/lib/commentText';
import { splitPhoneNumbers } from '@/lib/phoneText';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// A phone number in a tip, as a small raised button that calls it (tel:),
// in the text where the driver typed it. Tall enough for a thumb, and it
// presses in while held like the card's other buttons.
const phoneSx = [
  softRaisedSmall,
  softPressSx,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    verticalAlign: 'middle',
    minHeight: '2.5rem',
    px: 1.25,
    my: 0.25,
    borderRadius: 999,
    color: 'primary.main',
    fontWeight: 600,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    WebkitTapHighlightColor: 'transparent',
  },
];

// A comment's body, always rendered as text with its line breaks. Tips are
// plain text since 2026-10-07 (`format: 'text'`). Older comments were Tiptap
// HTML; scripts/convertHtmlComments.mjs converted them, and any still stored
// as HTML is flattened here, never parsed (docs/SECURITY.md #2). A US phone
// number in it is a button that calls it (lib/phoneText.js, since
// 2026-11-16); everything else stays text. Used by the home tips, the
// profile page and admin.
export default function CommentContent({ comment, variant = 'body1' }) {
  return (
    <Typography variant={variant} sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
      {splitPhoneNumbers(commentToText(comment)).map((part, index) =>
        part.tel ? (
          <Box
            key={index}
            component='a'
            href={`tel:${part.tel}`}
            aria-label={`Call ${part.text}`}
            sx={phoneSx}
          >
            <PhoneOutlined sx={{ fontSize: '1.1em' }} aria-hidden />
            {part.text}
          </Box>
        ) : (
          part.text
        ),
      )}
    </Typography>
  );
}

// The plain text of a comment, for the render and the edit box.
export function commentToText(comment) {
  return comment.format === 'text' ? comment.content : htmlToText(comment.content);
}
