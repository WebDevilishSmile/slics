import { Box, Typography } from '@mui/material';

// One section of a route as a numbered list (docs/SLIC-DIRECTIONS.md), for the
// directions sheet and the print page. No hooks and no theme functions, so a
// server component can render it too. Steps are plain text, never HTML.
export default function RouteSteps({ section }) {
  return (
    <Box
      component='ol'
      sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 1.75 }}
    >
      {section.steps.map((step, index) => (
        <Box component='li' key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'baseline' }}>
          <Typography
            component='span'
            aria-hidden
            sx={{
              typography: 'body2',
              fontWeight: 700,
              color: 'primary.main',
              minWidth: '1.75rem',
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            {index + 1}.
          </Typography>
          <Typography component='span' sx={{ typography: 'body1', lineHeight: 1.55 }}>
            {step}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
