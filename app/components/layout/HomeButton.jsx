'use client';

import { Home } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';

function HomeButton() {
  const router = useRouter();

  function handleHome() {
    router.push('/');
  }

  return (
    <Button
      sx={{ position: 'absolute', top: '4.8rem', left: '1rem' }}
      onClick={handleHome}
      variant='outlined'
      size='small'
    >
      <Home />
    </Button>
  );
}

export default HomeButton;
