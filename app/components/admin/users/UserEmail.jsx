import { Mail } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';

function UserEmail({ email }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Typography>Email:</Typography>
        <Typography variant='caption'>{email}</Typography>
      </Box>
      <IconButton href={`mailto:${email}`} aria-label={`Email ${email}`}>
        <Mail />
      </IconButton>
    </Box>
  );
}

export default UserEmail;
