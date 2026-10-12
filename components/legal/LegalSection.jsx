import { Box, Typography } from '@mui/material';

// A section's anchor, from its title: 'Your choices' → 'your-choices'. The
// summary card's "On this page" list (LegalSummary.jsx) links by it, so a
// driver can be sent straight to /privacy#your-choices.
export function legalSectionId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// One section of the privacy policy or terms, set open on the page (as /help
// sets its guides), titled with an h2 under the page's h1. scrollMarginTop
// keeps the title clear of the fixed header when a link jumps to it, and
// `.legal-section:target` (globals.css) rings the section a link lands on.
export default function LegalSection({ title, children }) {
  const id = legalSectionId(title);
  return (
    <Box
      component='section'
      id={id}
      aria-labelledby={`${id}-title`}
      className='legal-section'
      sx={{ mt: 6, borderRadius: 3, scrollMarginTop: '6rem' }}
    >
      <Typography
        id={`${id}-title`}
        variant='h5'
        component='h2'
        sx={{ fontWeight: 800, letterSpacing: '-0.01em', mb: 1.5 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}
