import { Typography } from '@mui/material';

export default function AboutTitle({ title }) {
  return (
    <Typography variant='h6' sx={{ textAlign: 'center', margin: '1rem auto' }}>
      {title}
    </Typography>
  );
}
