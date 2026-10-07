import Image from 'next/image';
import { Button } from '@mui/material';

import { BMC_URL } from '@/utils/variables';

// The Buy Me a Coffee button: their logo on the palette's `bmc` tile (light in
// both schemes, see utils/theme.js), opening the supporter page in a new tab.
// Call sites pass only spacing through `sx`.
function BmcButton({ sx }) {
  return (
    <Button
      variant='contained'
      color='bmc'
      href={BMC_URL}
      target='_blank'
      rel='noopener noreferrer'
      sx={sx}
    >
      <Image
        src='/bmc-brand-logo.svg'
        width={148}
        height={24}
        alt='Buy Me a Coffee'
      />
    </Button>
  );
}

export default BmcButton;
