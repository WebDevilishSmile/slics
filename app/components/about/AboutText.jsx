import theme from '@/utils/theme';
import { Typography } from '@mui/material';

export default function AboutText({ children }) {
  return (
    <Typography
      variant='body1'
      sx={{ textAlign: 'center', maxWidth: theme.layout.width.prose, margin: '1rem auto' }}
    >
      {children}
    </Typography>
  );
}
