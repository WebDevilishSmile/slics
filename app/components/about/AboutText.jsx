import { Typography } from '@mui/material';

export default function AboutText({ children }) {
  return (
    <Typography
      variant='body1'
      sx={{ textAlign: 'center', maxWidth: '40rem', margin: '1rem auto' }}
    >
      {children}
    </Typography>
  );
}
