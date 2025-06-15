import { MAX_WIDTH } from '@/utils/variables';
import { Typography } from '@mui/material';

function StyledHeading({ children, heading = 'h2' }) {
  return (
    <Typography
      variant={heading}
      sx={{
        maxWidth: MAX_WIDTH,
        textAlign: 'center',
        textTransform: 'uppercase',
        fontWeight: '700',
      }}
    >
      {children}
    </Typography>
  );
}

export default StyledHeading;
