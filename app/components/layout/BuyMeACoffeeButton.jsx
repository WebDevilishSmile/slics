import { Box } from '@mui/material';

import BouncingArrow from '../utility/BouncingArrow';
import BmcButton from './BmcButton';

// The Buy Me a Coffee button with the bouncing arrow above it — the closing
// call to action on the empty home screen and the About page.
export default function BuyMeACoffeeButton() {
  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <BouncingArrow />
      <BmcButton sx={{ mb: 1 }} />
    </Box>
  );
}
