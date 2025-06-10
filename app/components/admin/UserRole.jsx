import { AccountCircle, VerifiedUser } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';

function UserRole({ role }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Typography variant='subtitle1'>Role: {role}</Typography>
      <IconButton>
        {role === 'admin' ? <VerifiedUser /> : <AccountCircle />}
      </IconButton>
    </Box>
  );
}

export default UserRole;
