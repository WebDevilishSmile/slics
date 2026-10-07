import theme from '@/utils/theme';
import { Typography, Box } from '@mui/material';

import BmcButton from '../layout/BmcButton';

export default function NotMember() {
  return (
    <>
      <Typography variant='sectionHeading'>Cover Bid Jobs</Typography>
      <Box
        sx={{ textAlign: 'center', my: 4, px: 2, maxWidth: theme.layout.width.wide }}
      >
        <Typography sx={{ mt: 2 }}>
          You must be a SLICs supporter or member to view this page.
        </Typography>
        <Typography sx={{ mt: 2 }}>
          To become a member please click the button below to support the site
          and gain access to this page.
        </Typography>
        <BmcButton sx={{ mt: 2 }} />
      </Box>
    </>
  );
}
