import { Button, Paper, Typography } from '@mui/material';
import Link from 'next/link';

export default function MemberDisplay({ user }) {
  return (
    <Paper variant='panel' sx={{ justifyContent: 'center' }}>
      <Typography variant='h5' sx={{ textAlign: 'center', mb: 2 }}>
        Welcome, {user?.name.split(' ')[0] || 'Member'}!
      </Typography>
      <Typography variant='body1' sx={{ textAlign: 'center', mt: 2 }}>
        Thank you for being a valued member! I appreciate your support. In the
        menu you can access your history. You can view which SLICs you have
        looked up and when.
      </Typography>

      <Button
        variant='contained'
        sx={{ mt: 4 }}
        LinkComponent={Link}
        href='/history'
      >
        View History
      </Button>
    </Paper>
  );
}
