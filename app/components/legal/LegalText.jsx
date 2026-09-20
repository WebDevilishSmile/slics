import { Typography } from '@mui/material';

export default function LegalText({ children }) {
  return (
    <Typography variant='body1' sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
      {children}
    </Typography>
  );
}
