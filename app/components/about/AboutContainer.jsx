import { Paper } from '@mui/material';

export default function AboutContainer({ children }) {
  return (
    <Paper
      elevation={3}
      sx={{ padding: '2rem', margin: '2rem auto', maxWidth: '40rem' }}
    >
      {children}
    </Paper>
  );
}
