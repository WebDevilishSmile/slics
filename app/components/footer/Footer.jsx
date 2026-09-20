import { Facebook, GitHub, Instagram, X } from '@mui/icons-material';
import { Box, Button, IconButton, Typography } from '@mui/material';
import Image from 'next/image';
import FooterContainer from './FooterContainer';

function Footer() {
  const socialLinks = [
    {
      name: 'Instagram',
      icon: <Instagram sx={{ fontSize: '3rem' }} />,
      url: 'https://www.instagram.com/webdevilishsmile/',
    },
    {
      name: 'Facebook',
      icon: <Facebook sx={{ fontSize: '3rem' }} />,
      url: 'https://www.facebook.com/webdevilishsmile/',
    },
    {
      name: 'X',
      icon: <X sx={{ fontSize: '3rem' }} />,
      url: 'https://www.x.com/webdavila',
    },
    {
      name: 'GitHub',
      icon: <GitHub sx={{ fontSize: '3rem' }} />,
      url: 'https://www.github.com/webdevilishsmile',
    },
  ];

  return (
    <FooterContainer>
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'text.light',
        }}
      >
        <Box>
          {/* Social Links */}
          {socialLinks.map((link, index) => (
            <IconButton
              key={index}
              sx={{ color: 'text.light' }}
              href={link.url}
              target='_blank'
              rel='noopener'
              aria-label={link.name}
            >
              {link.icon}
            </IconButton>
          ))}
        </Box>

        <Box>
          {/* Links */}
          <Button variant='text' href='/privacy' sx={{ color: 'text.light' }}>
            Privacy Policy
          </Button>
          <Button variant='text' href='/terms' sx={{ color: 'text.light' }}>
            Terms of Service
          </Button>
        </Box>
      </Box>
      <Box>
        <Image
          src='/slics_logo_dark.png'
          alt='Description'
          width={100}
          height={100}
        />
      </Box>
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography
          variant='caption'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          Email me with questions, comments, concerns...
        </Typography>
        <Button variant='contained'>WebDevilishSmile@gmail.com</Button>
      </Box>
      <Typography
        variant='caption'
        sx={{ position: 'absolute', bottom: '2rem' }}
      >
        Copyright © {new Date().getFullYear()} Tiago Davila
      </Typography>
    </FooterContainer>
  );
}

export default Footer;
