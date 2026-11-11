import { Box, Typography } from '@mui/material';

import { formatWhen } from './format';

// The emails written on /admin/super/email, newest first (getSentEmails, from
// admin_audit): the subject, who it went to and when. The message itself
// isn't kept; Resend's dashboard has it.
export default function SentEmails({ emails }) {
  if (!emails.length) {
    return (
      <Typography variant='body2' color='text.secondary'>
        Nothing sent yet.
      </Typography>
    );
  }
  return (
    <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {emails.map((email) => (
        <Box component='li' key={email._id} sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{email.subject}</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ overflowWrap: 'anywhere' }}>
            {email.failed ? (
              <Box component='span' sx={{ color: 'error.main', fontWeight: 600 }}>
                Not sent ·{' '}
              </Box>
            ) : null}
            To {email.to} · {formatWhen(email.at)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
