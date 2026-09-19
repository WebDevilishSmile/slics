import theme from '@/utils/theme';
import { Typography } from '@mui/material';

function StyledHeading({ children, heading = 'h2' }) {
  return (
    <Typography
      variant={heading}
      sx={{
        maxWidth: theme.layout.maxWidth,
        textAlign: 'center',
        textTransform: 'uppercase',
        fontWeight: '800',
        px: 1,
      }}
    >
      {children}
    </Typography>
  );
}

export default StyledHeading;
