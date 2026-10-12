import { Box, Typography } from '@mui/material';

// Tailwind's preflight strips list bullets and indentation, so both are set
// back explicitly here. The bullets are brand blue.
export default function LegalList({ items }) {
  return (
    <Box
      component='ul'
      sx={{
        listStyle: 'disc',
        pl: 3,
        mb: 2,
        '&:last-child': { mb: 0 },
        '& li::marker': { color: 'primary.main' },
      }}
    >
      {items.map((item, index) => (
        <Typography key={index} component='li' variant='body1' sx={{ mb: 1 }}>
          {item}
        </Typography>
      ))}
    </Box>
  );
}
