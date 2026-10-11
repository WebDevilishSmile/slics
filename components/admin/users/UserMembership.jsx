import { Person, PersonOff } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// The membership line in a user's details, with the one place to grant or
// revoke it: a labeled button (the list row only shows a "Member" badge).
function UserMembership({ user, onToggle, disabled = false }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
        my: 1,
      }}
    >
      <Typography variant='subtitle1'>
        Membership: {user.bmcMember ? 'Active' : 'Inactive'}
      </Typography>
      <Button
        onClick={onToggle}
        // Not your own, and a super admin's membership isn't toggled from here.
        disabled={disabled || user.superAdmin}
        startIcon={user.bmcMember ? <PersonOff /> : <Person />}
        sx={[softRaisedSmall, softPressSx, { px: 2, minHeight: '2.75rem' }]}
      >
        {user.bmcMember ? 'Revoke' : 'Grant'}
      </Button>
    </Box>
  );
}

export default UserMembership;
