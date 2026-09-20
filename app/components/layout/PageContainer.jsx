import theme from '@/utils/theme';
import { Box } from '@mui/material';

export default function PageContainer({ children }) {
  return (
    <Box
      sx={{
        maxWidth: theme.layout.width.page,
        width: '100%',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        my: 16,
        mx: { xs: '0%', md: '10%', lg: '5%', xl: '15%' },
        px: { xs: 0.5, sm: 2, md: 4, lg: 6 },
      }}
    >
      {children}
    </Box>
  );
}
