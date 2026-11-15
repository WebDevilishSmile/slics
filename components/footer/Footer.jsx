import {
  EmailOutlined,
  Facebook,
  GitHub,
  Instagram,
  X,
} from '@mui/icons-material';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/constants';
import FooterContainer from './FooterContainer';

// Tiago's own accounts, under "Made by". The app's Instagram has its own line
// above them.
const socialLinks = [
  {
    name: 'Facebook',
    icon: Facebook,
    url: 'https://www.facebook.com/webdevilishsmile/',
  },
  { name: 'X', icon: X, url: 'https://www.x.com/webdavila' },
  {
    name: 'GitHub',
    icon: GitHub,
    url: 'https://www.github.com/webdevilishsmile',
  },
];

// Footer links are 44px tall, like the header's controls.
const linkSx = { minHeight: '2.75rem' };

// One compact column (UI-SUGGESTIONS.md #37): Help and the legal links first (the
// landing page's trust copy points at them), the contact email, the app's
// Instagram with the how-to videos, then who made the app with their social
// links, and the copyright. Everything inherits
// text.light from FooterContainer. The second logo is gone; the header
// carries the brand.
function Footer() {
  return (
    <FooterContainer>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant='text' color='inherit' href='/help' sx={linkSx}>
          Help
        </Button>
        <Button variant='text' color='inherit' href='/privacy' sx={linkSx}>
          Privacy Policy
        </Button>
        <Button variant='text' color='inherit' href='/terms' sx={linkSx}>
          Terms of Service
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant='caption' component='p'>
          Email me with questions, comments, concerns...
        </Typography>
        <Button
          variant='text'
          color='inherit'
          href={`mailto:${CONTACT_EMAIL}`}
          startIcon={<EmailOutlined />}
          sx={linkSx}
        >
          {CONTACT_EMAIL}
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant='caption' component='p'>
          Short how-to videos
        </Typography>
        <Button
          variant='text'
          color='inherit'
          href={INSTAGRAM_URL}
          target='_blank'
          rel='noopener'
          startIcon={<Instagram />}
          aria-label={`SLICs on Instagram, @${INSTAGRAM_HANDLE}`}
          sx={linkSx}
        >
          @{INSTAGRAM_HANDLE}
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant='caption' component='p'>
          Made by Tiago Davila
        </Typography>
        {socialLinks.map(({ name, icon: Icon, url }) => (
          <IconButton
            key={name}
            color='inherit'
            href={url}
            target='_blank'
            rel='noopener'
            aria-label={`Tiago Davila on ${name}`}
          >
            <Icon sx={{ fontSize: '2rem' }} />
          </IconButton>
        ))}
      </Box>

      <Typography variant='caption'>
        Copyright © {new Date().getFullYear()} Tiago Davila
      </Typography>
    </FooterContainer>
  );
}

export default Footer;
