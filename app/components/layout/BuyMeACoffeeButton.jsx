import Image from 'next/image';
import { Box, Button } from '@mui/material';
import { ArrowDownward } from '@mui/icons-material';

export default function BuyMeACoffeeButton() {
  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* Moving arrow */}
      <ArrowDownward
        sx={{
          fontSize: '2rem',
          mb: 2,
          animation: 'bounce 1.5s ease-in-out infinite',
          '@keyframes bounce': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(0.5rem)' },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      />

      <Button
        type='submit'
        variant='contained'
        href='https://buymeacoffee.com/tiagodavila'
        target='_blank'
        rel='noopener noreferrer'
        sx={{ backgroundColor: '#f7f7f7', color: 'black', mb: 4 }}
      >
        <Image
          src='/bmc-brand-logo.svg'
          width={148}
          height={24}
          alt='Buy Me a Coffee'
        />
      </Button>
    </Box>
  );
}
