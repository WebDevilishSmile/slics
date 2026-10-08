import theme from '@/theme';
import { Typography } from '@mui/material';

export default function AboutText({ children }) {
  return (
    <Typography
      variant='body1'
      sx={{
        textAlign: 'center',
        maxWidth: theme.layout.width.prose,
        mx: 'auto',
        my: 2,
      }}
    >
      {children}
    </Typography>
  );
}
