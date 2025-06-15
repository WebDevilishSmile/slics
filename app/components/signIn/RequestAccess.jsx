'use client';

import { Button, Typography } from '@mui/material';

function RequestAccess({ user }) {
  const message = `Hello, this is ${user.name}. My email is ${user.email}. Requesting access to SLICs.`;
  const encodedMessage = encodeURIComponent(message);
  const url = `sms:+19083297964?body=${encodedMessage}`;

  // function openMessagingAppWithPrefilledMessage() {
  //   window.open(url);
  // }

  return (
    <>
      <Typography variant='body2' sx={{ mt: '2rem', mb: '1rem', px: '1rem' }}>
        If you would like to request access to SLICs please click the button
        below.
      </Typography>
      <Button variant='contained' href={url}>
        Request Access
      </Button>
    </>
  );
}

export default RequestAccess;
