import {
  EmailOutlined,
  Facebook,
  GitHub,
  Instagram,
  X,
} from '@mui/icons-material';
import { Box, Button, IconButton, Typography } from '@mui/material';
import FooterContainer from './FooterContainer';

const CONTACT_EMAIL = 'WebDevilishSmile@gmail.com';

const socialLinks = [
  {
    name: 'Instagram',
    icon: Instagram,
    url: 'https://www.instagram.com/webdevilishsmile/',
  },
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

// One compact column (UI-SUGGESTIONS.md #37): social icons, the legal links,
// the contact email and the copyright. Everything inherits text.light from
// FooterContainer. The second logo is gone; the header carries the brand.
function Footer() {
  return (
    <FooterContainer>
      <Box>
        {socialLinks.map(({ name, icon: Icon, url }) => (
          <IconButton
            key={name}
            color='inherit'
            href={url}
            target='_blank'
            rel='noopener'
            aria-label={name}
          >
            <Icon sx={{ fontSize: '2rem' }} />
          </IconButton>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant='text' color='inherit' href='/privacy'>
          Privacy Policy
        </Button>
        <Button variant='text' color='inherit' href='/terms'>
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
        >
          {CONTACT_EMAIL}
        </Button>
      </Box>

      <Typography variant='caption'>
        Copyright © {new Date().getFullYear()} Tiago Davila
      </Typography>
    </FooterContainer>
  );
}

export default Footer;
