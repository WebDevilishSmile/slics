'use client';

import { CloseOutlined } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  IconButton,
  List,
  ListItem,
  Typography,
} from '@mui/material';
import { useState } from 'react';

function UserMenu({ children, user }) {
  const [open, setOpen] = useState(false);

  function handleOpen() {
    setOpen(true);
  }
  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <IconButton
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: '0.25rem',
        }}
        onClick={handleOpen}
      >
        <Avatar src={user ? user.image : null} />
      </IconButton>

      <Dialog open={open} onClose={handleClose} fullScreen>
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', top: '2rem', right: '2rem' }}
        >
          <CloseOutlined />
        </IconButton>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant='h2'>User Menu</Typography>

          <List>
            <ListItem>
              <Button>Home</Button>
            </ListItem>
            {children}
          </List>
        </Box>
      </Dialog>
    </>
  );
}

export default UserMenu;
