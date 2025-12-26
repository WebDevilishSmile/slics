'use client';

import { useRouter } from 'next/navigation';

import { ChevronLeftOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';

function BackButton() {
  const router = useRouter();

  function handleBack() {
    router.back();
  }

  return (
    <Button
      sx={{ position: 'absolute', top: '4.8rem', right: '1rem' }}
      onClick={handleBack}
      size='small'
      variant='outlined'
    >
      <ChevronLeftOutlined /> Back
    </Button>
  );
}

export default BackButton;
