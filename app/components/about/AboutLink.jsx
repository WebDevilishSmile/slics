import { Box, Button } from '@mui/material';
import { ArrowDownward } from '@mui/icons-material';
import Image from 'next/image';

export default function AboutLink({ link, children, color }) {
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
        href={link}
        target='_blank'
        rel='noopener noreferrer'
        sx={{ color, mb: 4 }}
      >
        {children}
      </Button>
    </Box>
  );
}
