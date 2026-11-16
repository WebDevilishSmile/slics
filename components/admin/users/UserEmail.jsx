import { Mail } from '@mui/icons-material';
import { Box, IconButton, Link, Typography } from '@mui/material';

import { softPressSx } from '@/components/utility/soft';

// The super admin's compose page with this address in "To"
// (/admin/super/email?to=, admin/hub/ComposeEmail.jsx).
export const composeEmailHref = (email) => `/admin/super/email?to=${encodeURIComponent(email)}`;

// An account's email on its /admin/users card. For the super admin, the
// address and the button open the app's own compose page with it filled in,
// so the email goes out from tiago@slics.app in the app's look; other staff
// can't open that page, so theirs is a mailto link.
function UserEmail({ email, compose = false }) {
  const href = compose ? composeEmailHref(email) : `mailto:${email}`;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Typography>Email:</Typography>
        {compose ? (
          <Link href={href} variant='caption' sx={{ overflowWrap: 'anywhere' }}>
            {email}
          </Link>
        ) : (
          <Typography variant='caption' sx={{ overflowWrap: 'anywhere' }}>
            {email}
          </Typography>
        )}
      </Box>
      <IconButton
        href={href}
        aria-label={compose ? `Write an email to ${email}` : `Email ${email}`}
        sx={[softPressSx, { width: '3rem', height: '3rem', flexShrink: 0 }]}
      >
        <Mail />
      </IconButton>
    </Box>
  );
}

export default UserEmail;
