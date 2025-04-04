import { Box, Typography } from '@mui/material';
import Image from 'next/image';

export default function Maintenance() {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        my: '2rem',
      }}
    >
      <Image
        src='/maintenance.png'
        width={360}
        height={240}
        alt='Maintenance'
      />
      <Typography>Sorry</Typography>
      <Typography>
        We&apos;re Experiencing Some Technical Difficulties
      </Typography>
    </Box>
  );
}
