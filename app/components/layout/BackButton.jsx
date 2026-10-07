'use client';

import { useRouter } from 'next/navigation';

import { ChevronLeftOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';

function BackButton() {
  const router = useRouter();

  function handleBack() {
    router.back();
  }

  // In the page flow like HomeButton (UI-SUGGESTIONS.md #37): render it first
  // inside PageContainer.
  return (
    <Button
      sx={{ alignSelf: 'flex-start', mb: 1 }}
      onClick={handleBack}
      size='small'
      variant='outlined'
      startIcon={<ChevronLeftOutlined />}
    >
      Back
    </Button>
  );
}

export default BackButton;
