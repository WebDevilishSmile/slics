import { AccountCircle, VerifiedUser } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';

function UserRole({ user, onToggle, canToggle }) {
  if (!user || !user._id) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Typography variant='subtitle1'>Role: {user.superAdmin ? 'super admin' : user.role}</Typography>
      <IconButton
        onClick={onToggle}
        disabled={!canToggle}
        aria-label={user.role === 'admin' ? 'Revoke admin role' : 'Grant admin role'}
      >
        {user.role === 'admin' ? <VerifiedUser /> : <AccountCircle />}
      </IconButton>
    </Box>
  );
}

export default UserRole;
