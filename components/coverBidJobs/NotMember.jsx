import { Paper, Typography } from '@mui/material';

import BmcButton from '@/components/layout/BmcButton';

export default function NotMember() {
  return (
    <>
      <Typography variant='sectionHeading'>Cover Bid Jobs</Typography>
      <Paper
        variant='panel'
        className='enter'
        sx={{ minHeight: 0, gap: 2, textAlign: 'center' }}
      >
        <Typography>
          You must be a SLICs supporter or member to view this page.
        </Typography>
        <Typography>
          To become a member please click the button below to support the site
          and gain access to this page.
        </Typography>
        <BmcButton sx={{ mt: 1 }} />
      </Paper>
    </>
  );
}
