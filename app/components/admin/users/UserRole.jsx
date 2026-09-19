import { AccountCircle, VerifiedUser } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';

function UserRole({ user, onToggle }) {
  if (!user || !user._id) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Typography variant='subtitle1'>Role: {user.role}</Typography>
      <IconButton
        onClick={onToggle}
        disabled={user.email === 'webdevilishsmile@gmail.com'}
        aria-label={user.role === 'admin' ? 'Revoke admin role' : 'Grant admin role'}
      >
        {user.role === 'admin' ? <VerifiedUser /> : <AccountCircle />}
      </IconButton>
    </Box>
  );
}

export default UserRole;
