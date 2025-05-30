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
      sx={{ position: 'absolute', top: '4.8rem', right: '1rem' }}
      onClick={handleBack}
    >
      <ChevronLeftOutlined /> Back
    </Button>
  );
}

export default BackButton;
