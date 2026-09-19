import { Button, Paper, Typography } from '@mui/material';
import Link from 'next/link';
import theme from '@/utils/theme';

export default function MemberDisplay({ user }) {
  return (
    <Paper
      elevation={theme.layout.elevation}
      sx={{
        width: '100%',
        maxWidth: theme.layout.maxWidth,
        minHeight: theme.layout.minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mt: '2rem',
        py: '2rem',
        px: '2rem',
      }}
    >
      <Typography variant='h5' sx={{ textAlign: 'center', mb: '1rem' }}>
        Welcome, {user?.name.split(' ')[0] || 'Member'}!
      </Typography>
      <Typography variant='body1' sx={{ textAlign: 'center', mt: '1rem' }}>
        Thank you for being a valued member! I appreciate your support. In the
        menu you can access your history. You can view which SLICs you have
        looked up and when.
      </Typography>

      <Button
        variant='contained'
        sx={{ mt: '2rem' }}
        LinkComponent={Link}
        href='/history'
      >
        View History
      </Button>
    </Paper>
  );
}
