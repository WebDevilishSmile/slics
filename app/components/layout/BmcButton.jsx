import Image from 'next/image';
import { Button } from '@mui/material';

import theme from '@/theme';
import { BMC_URL } from '@/constants';
import { softContainedSx } from '../utility/soft';

// The Buy Me a Coffee button: their logo on the palette's `bmc` tile (light in
// both schemes, see theme.js), opening the supporter page in a new tab.
// It sits on the soft shadow like every contained button. Call sites pass
// only spacing through `sx`.
function BmcButton({ sx }) {
  return (
    <Button
      variant='contained'
      color='bmc'
      href={BMC_URL}
      target='_blank'
      rel='noopener noreferrer'
      sx={[softContainedSx(theme), sx]}
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
