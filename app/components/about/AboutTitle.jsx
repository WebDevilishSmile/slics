import { Typography } from '@mui/material';

export default function AboutTitle({ title }) {
  return (
    <Typography
      variant='h5'
      component='h3'
      sx={{ textAlign: 'center', mx: 'auto', mb: 2 }}
    >
      {title}
    </Typography>
  );
}
