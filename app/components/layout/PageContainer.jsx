import { Box } from '@mui/material';

export default function PageContainer({ children }) {
  return (
    <Box
      sx={{
        maxWidth: '1436px',
        width: '100%',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        my: '10rem',
        mx: { xs: '0%', md: '10%', lg: '5%', xl: '15%' },
        px: { xs: '1rem', md: '2rem', lg: '3rem' },
      }}
    >
      {children}
    </Box>
  );
}
