import { Typography } from '@mui/material';

function StyledHeading({ children, heading = 'h2' }) {
  return (
    <Typography
      variant={heading}
      sx={{
        maxWidth: '55rem',
        textAlign: 'center',
        textTransform: 'uppercase',
        fontWeight: '700',
        py: '1rem',
      }}
    >
      {children}
    </Typography>
  );
}

export default StyledHeading;
