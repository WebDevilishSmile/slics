import { Phone, Sms } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';

function UserPhone({ phone }) {
  const cleanPhone = phone.replace(/\D/g, ''); // Remove non-numeric characters
  const smsHref = `sms:${cleanPhone}`;
  const phoneHref = `tel:${cleanPhone}`;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Typography>Phone: {phone}</Typography>

      <Box sx={{ display: 'flex', gap: '0.5rem' }}>
        <IconButton href={smsHref}>
          <Sms />
        </IconButton>
        <IconButton href={phoneHref}>
          <Phone />
        </IconButton>
      </Box>
    </Box>
  );
}

export default UserPhone;
