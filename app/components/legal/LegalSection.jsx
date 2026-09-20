import theme from '@/utils/theme';
import { Paper, Typography } from '@mui/material';

export default function LegalSection({ title, children }) {
  return (
    <Paper
      component='section'
      elevation={3}
      sx={{
        width: '100%',
        maxWidth: theme.layout.width.prose,
        p: { xs: 2, sm: 4 },
        my: 2,
      }}
    >
      <Typography variant='h6' component='h3' sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}
