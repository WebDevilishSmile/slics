import Image from 'next/image';
import StyledHeading from '../layout/StyledHeading';
import { Typography, Button, Box } from '@mui/material';

export default function NotMember() {
  return (
    <>
      <StyledHeading>Cover Bid Jobs</StyledHeading>
      <Box
        sx={{ textAlign: 'center', my: '2rem', px: '1rem', maxWidth: '45rem' }}
      >
        <Typography sx={{ mt: 2 }}>
          You must be a SLICs supporter or member to view this page.
        </Typography>
        <Typography sx={{ mt: 2 }}>
          To become a member please click the button below to support the site
          and gain access to this page.
        </Typography>
        <Button
          type='submit'
          variant='contained'
          href='https://buymeacoffee.com/tiagodavila'
          target='_blank'
          rel='noopener noreferrer'
          sx={{ backgroundColor: '#f7f7f7', color: 'black', mt: 2 }}
        >
          <Image
            src='/bmc-brand-logo.svg'
            width={148}
            height={24}
            alt='Buy Me a Coffee'
          />
        </Button>
      </Box>
    </>
  );
}
