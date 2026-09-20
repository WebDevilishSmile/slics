'use client';

import { Button, Typography } from '@mui/material';

function RequestAccess({ user, isMobile }) {
  // If the user is on a mobile device, we provide a link to send an SMS
  const message = `Hello, this is ${user.name}. My email is ${user.email}. Requesting access to SLICs.`;
  const encodedMessage = encodeURIComponent(message);
  const url = `sms:+19083297964?body=${encodedMessage}`;

  if (isMobile) {
    return (
      <>
        <Typography variant='body2' sx={{ mt: 4, mb: 2, px: 2 }}>
          If you would like to request access to SLICs please click the button
          below.
        </Typography>
        <Button variant='contained' href={url}>
          Request Access
        </Button>
      </>
    );
  }

  // For desktop users, we can provide an email link instead
  const emailSubject = 'Request Access to SLICs';
  const emailBody = `Hello, this is ${user.name}. My email is ${user.email}. Requesting access to SLICs.`;
  const emailUrl = `mailto:webdevilishsmile@gmail.com?subject=${encodeURIComponent(
    emailSubject
  )}&body=${encodeURIComponent(emailBody)}`;

  return (
    <>
      <Typography variant='body2' sx={{ mt: 4, mb: 2, px: 2 }}>
        If you would like to request access to SLICs please click the button
        below.
      </Typography>
      <Button variant='contained' href={emailUrl}>
        Request Access
      </Button>
    </>
  );
}

export default RequestAccess;
