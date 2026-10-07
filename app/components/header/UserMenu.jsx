'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AdminPanelSettingsOutlined,
  AssignmentOutlined,
  BadgeOutlined,
  CheckroomOutlined,
  CloseOutlined,
  HistoryOutlined,
  HubOutlined,
  InfoOutlined,
  LocalCafeOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuOutlined,
  OpenInNew,
  PersonOutline,
  SearchOutlined,
  SignpostOutlined,
} from '@mui/icons-material';
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  SwipeableDrawer,
  Typography,
  useMediaQuery,
} from '@mui/material';

import { BMC_URL } from '@/utils/variables';

import InstallMenuItem from '../install/InstallMenuItem';
import ModeSwitch from '../layout/ModeSwitch';

const MENU_ID = 'app-menu';

// Every row is at least 48px tall — a driver's thumb, maybe gloved, in a cab
// (UI-SUGGESTIONS.md "Design target").
const rowSx = (theme) => ({
  minHeight: '3rem',
  // The current page: bold label and a brand-colored icon. primary.dark on
  // the light paper (primary.main fails contrast there, #31); primary.main on
  // the dark paper, where primary.dark is too dim.
  '&.Mui-selected .MuiListItemText-primary': { fontWeight: 700 },
  '&.Mui-selected .MuiListItemIcon-root': {
    color: theme.vars.palette.primary.dark,
    ...theme.applyStyles('dark', { color: theme.vars.palette.primary.main }),
  },
});

// An internal page. next/link makes it a client-side navigation instead of a
// full reload (#53); the drawer closes itself when the route changes.
function NavItem({ href, label, secondary, icon, current }) {
  return (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        href={href}
        selected={current}
        aria-current={current ? 'page' : undefined}
        sx={rowSx}
      >
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={label} secondary={secondary} />
      </ListItemButton>
    </ListItem>
  );
}

function ExternalItem({ href, label, icon }) {
  return (
    <ListItem disablePadding>
      <ListItemButton
        component='a'
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        sx={rowSx}
      >
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={label} />
        <OpenInNew
          fontSize='small'
          color='action'
          titleAccess='opens in a new tab'
        />
      </ListItemButton>
    </ListItem>
  );
}

// The header menu: a drawer from the left, grouped as UI-SUGGESTIONS.md #50
// lays out — where you go every day, your account, outside links, then
// settings. Swipe it left, tap outside or press Escape to close it.
// `signOutAction` is a server action from Header.jsx.
function UserMenu({ user, signOutAction }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Close on sign-out, and on any route change (a menu tap, back/forward).
  useEffect(() => {
    if (!user) setOpen(false);
  }, [user]);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // `section` also marks the row on that route's sub-pages (/admin/slics).
  const isCurrent = (href, section = false) =>
    pathname === href || (section && pathname.startsWith(`${href}/`));
  const firstName = user?.name?.split(' ').at(0);

  return (
    <>
      <IconButton
        sx={{ color: 'text.light' }}
        onClick={handleOpen}
        aria-label='Open menu'
        aria-expanded={open}
        aria-controls={MENU_ID}
      >
        <MenuOutlined />
      </IconButton>

      <SwipeableDrawer
        anchor='left'
        open={open}
        onOpen={handleOpen}
        onClose={handleClose}
        // Opening is the button's job: an edge swipe fights iOS's back gesture.
        disableSwipeToOpen
        transitionDuration={reduceMotion ? 0 : undefined}
        slotProps={{
          paper: {
            id: MENU_ID,
            component: 'nav',
            'aria-label': 'Main menu',
            sx: { width: 'min(20rem, 80vw)' },
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 2,
            bgcolor: 'primary.dark',
            color: 'common.white',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '2.4rem',
              height: '2.4rem',
              flexShrink: 0,
            }}
          >
            <Image
              src='/slics-logo-dark.png'
              fill
              style={{ objectFit: 'contain' }}
              alt=''
              sizes='2.4rem'
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant='h6'
              component='p'
              sx={{ fontWeight: 800, lineHeight: 1.2 }}
            >
              SLICs
            </Typography>
            <Typography variant='body2' noWrap>
              {firstName ? `Hi, ${firstName}` : 'Not signed in'}
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            aria-label='Close menu'
            sx={{ color: 'inherit' }}
          >
            <CloseOutlined />
          </IconButton>
        </Box>

        {user && (
          <>
            <List>
              <NavItem
                href='/home'
                label='Look up a SLIC'
                icon={<SearchOutlined />}
                current={isCurrent('/home', true)}
              />
              <NavItem
                href='/all'
                label='All Hubs'
                icon={<HubOutlined />}
                current={isCurrent('/all')}
              />
              {user.bmcMember && (
                <>
                  <NavItem
                    href='/history'
                    label='My History'
                    secondary='Member only'
                    icon={<HistoryOutlined />}
                    current={isCurrent('/history')}
                  />
                  <NavItem
                    href='/cover-bid-jobs'
                    label='Cover Bids'
                    secondary='Member only'
                    icon={<AssignmentOutlined />}
                    current={isCurrent('/cover-bid-jobs')}
                  />
                </>
              )}
              {/* Admin-only while it's tried out in production; drop the
                  role check to launch it to every driver. */}
              {user.role === 'admin' && (
                <NavItem
                  href='/whip-it-in-and-out'
                  label='Whip It In & Out'
                  secondary='Admin only for now'
                  icon={<SignpostOutlined />}
                  current={isCurrent('/whip-it-in-and-out')}
                />
              )}
            </List>
            <Divider />
          </>
        )}

        <List>
          {user && (
            <NavItem
              href={`/profile/${user.id}`}
              label='Profile'
              icon={<PersonOutline />}
              current={isCurrent(`/profile/${user.id}`)}
            />
          )}
          {/* /covers is built but deliberately not linked yet. */}
          {user?.role === 'admin' && (
            <NavItem
              href='/admin'
              label='Admin'
              secondary='Admin only'
              icon={<AdminPanelSettingsOutlined />}
              current={isCurrent('/admin', true)}
            />
          )}
          <NavItem
            href='/about'
            label='About'
            icon={<InfoOutlined />}
            current={isCurrent('/about')}
          />
          <InstallMenuItem />
        </List>

        {user && (
          <>
            <Divider />
            <List
              subheader={<ListSubheader disableSticky>Links</ListSubheader>}
            >
              <ExternalItem
                href='https://www.upsers.com'
                label='UPSers'
                icon={<BadgeOutlined />}
              />
              <ExternalItem
                href='https://vestisuniforms.com/ups/'
                label='Socks'
                icon={<CheckroomOutlined />}
              />
              <ExternalItem
                href={BMC_URL}
                label='Buy me a Coffee'
                icon={<LocalCafeOutlined />}
              />
            </List>
          </>
        )}

        <Divider />
        <List>
          <ModeSwitch />
          {user ? (
            <ListItem disablePadding>
              <Box
                component='form'
                action={signOutAction}
                sx={{ width: '100%' }}
              >
                <ListItemButton
                  component='button'
                  type='submit'
                  sx={[rowSx, { width: '100%' }]}
                >
                  <ListItemIcon>
                    <LogoutOutlined />
                  </ListItemIcon>
                  <ListItemText primary='Sign out' />
                </ListItemButton>
              </Box>
            </ListItem>
          ) : (
            <NavItem
              href='/'
              label='Sign in'
              icon={<LoginOutlined />}
              current={isCurrent('/')}
            />
          )}
        </List>
      </SwipeableDrawer>
    </>
  );
}

export default UserMenu;
