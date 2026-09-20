import theme from '@/utils/theme';
import { Paper } from '@mui/material';

export default function AboutContainer({ children }) {
  return (
    <Paper
      elevation={3}
      sx={{ padding: 4, margin: '2rem auto', maxWidth: theme.layout.width.prose }}
    >
      {children}
    </Paper>
  );
}
