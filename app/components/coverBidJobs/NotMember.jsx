import theme from '@/utils/theme';
import Image from 'next/image';
import { Typography, Button, Box } from '@mui/material';

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
