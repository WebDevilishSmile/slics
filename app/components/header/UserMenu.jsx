'use client';

import { CloseOutlined, MenuOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  IconButton,
  List,
  ListItem,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

function UserMenu({ children, user }) {
  const [open, setOpen] = useState(false);

  function handleOpen() {
    setOpen(true);
  }
  function handleClose() {
    setOpen(false);
  }

  // If user signs out, we want to close the menu
  useEffect(() => {
    if (!user) {
      setOpen(false);
    }
  }, [user]);

  return (
    <>
      <IconButton
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'text.light',
        }}
        onClick={handleOpen}
      >
        <MenuOutlined />
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
          <Typography variant='h2'>Menu</Typography>

          <List>
            <ListItem>
              <Button href={user ? '/home' : '/'}>Home</Button>
            </ListItem>
            {user && (
              <>
                <ListItem>
                  <Button href={`/profile/${user.id}`}>Profile</Button>
                </ListItem>
                {user.bmcMember && (
                  <>
                    <ListItem>
                      <Button href='/history'>My History</Button>
                    </ListItem>
                    <ListItem>
                      <Button href={`/cover-bid-jobs`}>Cover Bids</Button>
                    </ListItem>
                  </>
                )}
                <ListItem>
                  <Button href={`/all`}>All Hubs</Button>
                </ListItem>
                <ListItem>
                  <Button
                    href={`https://www.upsers.com`}
                    rel='noopener noreferrer'
                    target='_blank'
                  >
                    UPSers
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    href={`https://vestisuniforms.com/ups/`}
                    rel='noopener noreferrer'
                    target='_blank'
                  >
                    Socks
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    href={`https://buymeacoffee.com/tiagodavila`}
                    rel='noopener noreferrer'
                    target='_blank'
                  >
                    Buy me a Coffee
                  </Button>
                </ListItem>
              </>
            )}
            <ListItem>
              <Button href='/about'>About</Button>
            </ListItem>
            {children}
          </List>
        </Box>
      </Dialog>
    </>
  );
}

export default UserMenu;
