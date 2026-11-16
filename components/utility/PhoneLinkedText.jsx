import { PhoneOutlined } from '@mui/icons-material';
import { Box } from '@mui/material';

import { splitPhoneNumbers } from '@/lib/phoneText';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// A phone number in a driver's text, as a small raised button that calls it
// (tel:), in the text where it was typed. Tall enough for a thumb, and it
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

// Plain text with every US phone number in it turned into a tap-to-call
// button written (610) 555-0134 however it was typed (lib/phoneText.js). The
// rest stays text, never HTML. Put it inside a Typography with
// `whiteSpace: 'pre-wrap'`: Driver tips (comments/CommentContent.jsx) and
// Places comments (places/PlaceComment.jsx).
export default function PhoneLinkedText({ text }) {
  return splitPhoneNumbers(text).map((part, index) =>
    part.tel ? (
      <Box key={index} component='a' href={`tel:${part.tel}`} aria-label={`Call ${part.display}`} sx={phoneSx}>
        <PhoneOutlined sx={{ fontSize: '1.1em' }} aria-hidden />
        {part.display}
      </Box>
    ) : (
      part.text
    ),
  );
}
