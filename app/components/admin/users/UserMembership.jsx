import { Person, PersonOff } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';

function UserMembership({ user, onToggle }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Typography variant='subtitle1'>
        Membership: {user.bmcMember ? 'Active' : 'Inactive'}
      </Typography>
      <IconButton
        onClick={onToggle}
        disabled={user.email === 'webdevilishsmile@gmail.com'}
      >
        {user.bmcMember ? <Person /> : <PersonOff />}
      </IconButton>
    </Box>
  );
}

export default UserMembership;
