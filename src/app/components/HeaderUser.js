import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Modal, List, ListItemIcon, Menu, MenuItem, Box } from '@mui/material';

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import HowToModal from './HowToModal';
import LoginIcon from '@mui/icons-material/Login';
import DescriptionIcon from '@mui/icons-material/Description';

export default function HeaderUser({
  anchorUser,
  setAnchorUser,
  openUser,
  session,
}) {
  const [howToModal, setHowToModal] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleUserClose = () => {
    setAnchorUser(null);
  };

  const handleHowToModalOpen = () => {
    setHowToModal(true);
  };
  const handleHowToModalClose = () => {
    setHowToModal(false);
    handleUserClose();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    handleUserClose();
    router.refresh();
  };

  const userLinks = [
    {
      title: 'Home',
      link: '/',
      onClick: handleUserClose,
      icon: <HomeOutlinedIcon />,
    },
    {
      title: 'Profile',
      link: '/profile',
      onClick: handleUserClose,
      icon: <AccountCircleOutlinedIcon />,
    },
    {
      title: 'How to Use This Site',
      link: '',
      onClick: handleHowToModalOpen,
      icon: <SlideshowIcon />,
    },
    {
      title: 'UPS Google Docs',
      link: 'https://docs.google.com/spreadsheets/u/0/d/1PZHLmYXGzWqZjeIWZnrlubUBzC4aoqfbEy0X_mQH0v4/htmlview',
      onClick: handleUserClose,
      icon: <DescriptionIcon />,
    },
    {
      title: 'Sign Out',
      link: '/',
      onClick: handleSignOut,
      icon: <ExitToAppOutlinedIcon />,
    },
  ];

  const renderedUserLinks = userLinks.map((item, index) => {
    return (
      <MenuItem
        key={index}
        component={Link}
        href={item.link}
        onClick={item.onClick}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        {item.title}
      </MenuItem>
    );
  });

  return (
    <Menu
      disableScrollLock
      anchorEl={anchorUser}
      open={openUser}
      onClose={handleUserClose}
    >
      {session ? (
        <List>{renderedUserLinks}</List>
      ) : (
        <List>
          <MenuItem component={Link} href='/login' onClick={handleUserClose}>
            <ListItemIcon>
              <LoginIcon />
            </ListItemIcon>
            Login
          </MenuItem>
          <MenuItem component={Link} href='' onClick={handleHowToModalOpen}>
            <ListItemIcon>
              <SlideshowIcon />
            </ListItemIcon>
            How to Use this Site
          </MenuItem>
        </List>
      )}
      <Modal open={howToModal} onClose={handleHowToModalClose}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          <HowToModal handleHowToModalClose={handleHowToModalClose} />
        </Box>
      </Modal>
    </Menu>
  );
}
