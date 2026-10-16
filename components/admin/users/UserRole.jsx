import { useState } from 'react';
import { ExpandMore } from '@mui/icons-material';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';

import { ROLE_LABELS } from '@/constants';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

const ROLES = ['user', 'dispatch', 'admin'];

// The role line in a user's details, with the one place to change it: a menu
// of the three roles (docs/STAFF-ROLES.md), for a super admin only
// (`canChange`). The list row only shows the role.
function UserRole({ user, onChange, canChange }) {
  const [anchor, setAnchor] = useState(null);
  if (!user || !user._id) return null;

  const role = user.role || 'user';
  const label = user.superAdmin ? 'Super admin' : (ROLE_LABELS[role] ?? role);
  const menuId = `role-menu-${user._id}`;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        my: 1,
      }}
    >
      <Typography variant='subtitle1'>Role: {label}</Typography>
      {canChange && (
        <>
          <Button
            onClick={(event) => setAnchor(event.currentTarget)}
            aria-haspopup='menu'
            aria-expanded={Boolean(anchor)}
            aria-controls={anchor ? menuId : undefined}
            endIcon={<ExpandMore />}
            sx={[softRaisedSmall, softPressSx, { px: 2, minHeight: '2.75rem' }]}
          >
            Change
          </Button>
          <Menu id={menuId} anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            {ROLES.map((option) => (
              <MenuItem
                key={option}
                selected={option === role}
                onClick={() => {
                  setAnchor(null);
                  if (option !== role) onChange(option);
                }}
                sx={{ minHeight: '3rem' }}
              >
                {ROLE_LABELS[option]}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
}

export default UserRole;
