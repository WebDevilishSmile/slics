import theme from '@/theme';
import { Box } from '@mui/material';
import Image from 'next/image';

import { softInset } from '@/components/utility/soft';

// A round inset well for a section's picture or icon (one emboss level: the
// section card is already raised).
const wellSx = [
  softInset(theme),
  {
    borderRadius: '50%',
    overflow: 'hidden',
    width: 120,
    height: 120,
    mx: 'auto',
  },
];

export default function AboutImage({ source, altText, icon }) {
  if (icon) {
    return (
      <Box
        sx={[
          ...wellSx,
          { display: 'flex', alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        {icon}
      </Box>
    );
  }
  return (
    <Box sx={wellSx}>
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
