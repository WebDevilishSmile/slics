import { Box } from '@mui/material';
import Footer from '../footer/Footer';

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
        my: '7rem',
        mx: { xs: '0%', md: '10%', lg: '5%', xl: '15%' },
        px: { xs: '0.25rem', sm: '1rem', md: '2rem', lg: '3rem' },
      }}
    >
      {children}
    </Box>
  );
}
