import { AttachFileOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';

import { formatWhen } from './format';

// The emails written on /admin/super/email, newest first (getSentEmails, from
// admin_audit): the subject, who it went to, when, and its files by name. The
// message and the files themselves aren't kept; Resend's dashboard has them.
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
            {!email.failed && email.notSent ? (
              <Box component='span' sx={{ color: 'error.main', fontWeight: 600 }}>
                {' '}
                · {email.notSent} didn&apos;t go
              </Box>
            ) : null}
          </Typography>
          {email.attachments?.length ? (
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, overflowWrap: 'anywhere' }}
            >
              <AttachFileOutlined fontSize='small' aria-hidden sx={{ mt: '0.1rem', color: 'primary.main' }} />
              <span>
                <Box component='span' sx={visuallyHidden}>
                  Attached:{' '}
                </Box>
                {email.attachments.join(', ')}
              </span>
            </Typography>
          ) : null}
        </Box>
      ))}
    </Box>
  );
}
