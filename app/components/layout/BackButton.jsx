'use client';

import { ChevronLeftOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';

function BackButton() {
  const router = useRouter();

  function handleBack() {
    router.back();
  }

  return (
    <Button
      sx={{ position: 'absolute', top: '6rem', right: '2rem' }}
      onClick={handleBack}
    >
      <ChevronLeftOutlined /> Back
    </Button>
  );
}

export default BackButton;
