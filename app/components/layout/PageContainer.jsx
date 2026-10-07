import theme from '@/utils/theme';
import { Box } from '@mui/material';

// The content column of a page: width, side margins and padding. The
// full-screen height and the page background belong to layout/Container.jsx
// (the app shell around header, page and footer); repeating minHeight here
// made every page at least a screen tall before the footer (UI-SUGGESTIONS.md
// #24, #37).
export default function PageContainer({ children }) {
  return (
    <Box
      sx={{
        maxWidth: theme.layout.width.page,
        width: '100%',
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
