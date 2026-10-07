'use client';

import { Home } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';

function HomeButton() {
  const router = useRouter();

  function handleHome() {
    router.push('/');
  }

  // In the page flow, on its own row above the title (UI-SUGGESTIONS.md #37).
  // It used to be absolutely positioned at a guess of the header's height.
  // Render it first inside PageContainer.
  return (
    <Button
      sx={{ alignSelf: 'flex-start', mb: 1 }}
      onClick={handleHome}
      variant='outlined'
      size='small'
      aria-label='Home'
    >
      <Home />
    </Button>
  );
}

export default HomeButton;
