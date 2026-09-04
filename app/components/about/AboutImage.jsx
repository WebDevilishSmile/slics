import { Box } from '@mui/material';
import Image from 'next/image';

export default function AboutImage({ source, altText, icon }) {
  if (icon) {
    return (
      <Box
        sx={{
          borderRadius: '50%',
          overflow: 'hidden',
          width: 120,
          height: 120,
          margin: 'auto',
          boxShadow: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
    );
  }
  return (
    <Box
      sx={{
        borderRadius: '50%',
        overflow: 'hidden',
        width: 120,
        height: 120,
        margin: '0 auto',
        boxShadow: 3,
      }}
    >
      <Image
        src={source}
        width={120}
        height={120}
        alt={altText}
        style={{
          width: '110%',
          height: '110%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
    </Box>
  );
}
