import { Box } from '@mui/material';

function StyledPage({ children }) {
  return (
    <Box
      sx={{
        width: '100dvw',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'start',
        px: '1rem',
        pt: '2.5rem',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      {children}
    </Box>
  );
}

export default StyledPage;
