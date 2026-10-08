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

import { BMC_URL } from '@/constants';

import InstallMenuItem from '../install/InstallMenuItem';
import ModeSwitch from '../layout/ModeSwitch';
import { softListItemSx } from '../utility/soft';

const MENU_ID = 'app-menu';

// Every row is at least 48px tall — a driver's thumb, maybe gloved, in a cab
// (UI-SUGGESTIONS.md "Design target"). Soft rows (utility/soft.js): the
// current page is pressed in, with a bold label and a brand-colored icon.
// primary.main is picked per scheme to read on that scheme's surface (#31).
const rowSx = [
  softListItemSx,
  {
    minHeight: '3rem',
    '&.Mui-selected .MuiListItemText-primary': { fontWeight: 700 },
    '&.Mui-selected .MuiListItemIcon-root': { color: 'primary.main' },
  },
];

// The menu's groups are told apart by space, not divider lines.
const groupSx = { display: 'flex', flexDirection: 'column', gap: 0.5, py: 1.5 };

// An internal page. next/link makes it a client-side navigation instead of a
// full reload (#53). `onClick` closes the drawer on the tap itself, so it's
// out of the way while the page loads and also closes for the page that's
// already open (which has no route change to close it).
function NavItem({ href, label, secondary, icon, current, onClick }) {
  return (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        href={href}
        onClick={onClick}
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
        // On the blue header the focus outline takes the icon's color.
        sx={{ color: 'text.light', '&.Mui-focusVisible': { outlineColor: 'currentColor' } }}
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
            sx={{ color: 'inherit', '&.Mui-focusVisible': { outlineColor: 'currentColor' } }}
          >
            <CloseOutlined />
          </IconButton>
        </Box>

        {user && (
          <>
            <List sx={groupSx}>
              <NavItem
                onClick={handleClose}
                href='/home'
                label='Look up a SLIC'
                icon={<SearchOutlined />}
                current={isCurrent('/home', true)}
              />
              <NavItem
                onClick={handleClose}
                href='/all'
                label='All Hubs'
                icon={<HubOutlined />}
                current={isCurrent('/all')}
              />
              {user.bmcMember && (
                <>
                  <NavItem
                    onClick={handleClose}
                    href='/history'
                    label='My History'
                    secondary='Member only'
                    icon={<HistoryOutlined />}
                    current={isCurrent('/history')}
                  />
                  <NavItem
                    onClick={handleClose}
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
                  onClick={handleClose}
                  href='/whip-it-in-and-out'
                  label='Whip It In & Out'
                  secondary='Admin only for now'
                  icon={<SignpostOutlined />}
                  current={isCurrent('/whip-it-in-and-out')}
                />
              )}
            </List>
          </>
        )}

        <List sx={groupSx}>
          {user && (
            <NavItem
              onClick={handleClose}
              href={`/profile/${user.id}`}
              label='Profile'
              icon={<PersonOutline />}
              current={isCurrent(`/profile/${user.id}`)}
            />
          )}
          {/* /covers is built but deliberately not linked yet. */}
          {user?.role === 'admin' && (
            <NavItem
              onClick={handleClose}
              href='/admin'
              label='Admin'
              secondary='Admin only'
              icon={<AdminPanelSettingsOutlined />}
              current={isCurrent('/admin', true)}
            />
          )}
          <NavItem
            onClick={handleClose}
            href='/about'
            label='About'
            icon={<InfoOutlined />}
            current={isCurrent('/about')}
          />
          <InstallMenuItem />
        </List>

        {user && (
          <List
            sx={groupSx}
            subheader={
              <ListSubheader disableSticky sx={{ bgcolor: 'transparent' }}>
                Links
              </ListSubheader>
            }
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
        )}

        <List sx={groupSx}>
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
                  sx={[...rowSx, { width: '100%' }]}
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
              onClick={handleClose}
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
