'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AdminPanelSettingsOutlined,
  AssignmentOutlined,
  BadgeOutlined,
  CheckroomOutlined,
  CloseOutlined,
  EventAvailableOutlined,
  HelpOutline,
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
  Badge,
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

import { BMC_URL, COVERS_OPEN, PLACES_NEW_UNTIL } from '@/constants';
import { refreshOpenDisputesCount, useOpenDisputesCount } from '@/lib/coverDisputesStore';
import { refreshPendingClaimsCount, usePendingClaimsCount } from '@/lib/driverClaimsStore';
import { refreshJobChangesCount, useJobChangesCount } from '@/lib/jobChangesStore';
import { refreshOpenReportsCount, useOpenReportsCount } from '@/lib/slicReportsStore';

import InstallMenuItem from '@/components/install/InstallMenuItem';
import ModeSwitch from '@/components/layout/ModeSwitch';
import SlicsMark from '@/components/utility/SlicsMark';
import { softListItemSx } from '@/components/utility/soft';
import VerifiedBadge from '@/components/utility/VerifiedBadge';

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
// `signOutAction` is a server action from Header.jsx. `features` is the
// session's feature switches (auth.js, lib/db/appSettings.js); the constants
// are the defaults when there's none.
function UserMenu({ user, features, signOutAction }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // Admins: Jobs-tab changes they haven't seen (stage 3 alerts,
  // docs/ON-CALL-SHEET-SYNC.md; /admin/jobs clears them), open SLIC reports
  // (RECOMMENDATIONS.md #5; they count until closed on /admin/reports) and
  // driver claims waiting for a decision and open cover list disputes
  // (docs/COVER-BIDDING.md), all rechecked on every route change.
  const isAdmin = user?.role === 'admin';
  const jobChanges = useJobChangesCount();
  const openReports = useOpenReportsCount();
  const pendingClaims = usePendingClaimsCount();
  const openDisputes = useOpenDisputesCount();
  const alerts = jobChanges + openReports + pendingClaims + openDisputes;
  const alertsText = [
    jobChanges && `${jobChanges} job change${jobChanges === 1 ? '' : 's'}`,
    openReports && `${openReports} SLIC report${openReports === 1 ? '' : 's'}`,
    pendingClaims && `${pendingClaims} driver claim${pendingClaims === 1 ? '' : 's'}`,
    openDisputes && `${openDisputes} cover list dispute${openDisputes === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(', ');
  useEffect(() => {
    if (!isAdmin) return;
    refreshJobChangesCount();
    refreshOpenReportsCount();
    refreshPendingClaimsCount();
    refreshOpenDisputesCount();
  }, [isAdmin, pathname]);
  // Covers is admin-only while it's tested, until the super admin's switch
  // opens it (canUseCovers in lib/authz.js).
  const coversOpen = features?.coversOpen ?? COVERS_OPEN;
  const canUseCovers = Boolean(user) && (coversOpen || isAdmin);
  // Places opened to everyone on 2026-10-12; its row says "New" until the
  // date the super admin set.
  const placesIsNew = new Date().toISOString() < (features?.placesNewUntil ?? PLACES_NEW_UNTIL);

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
        aria-label={isAdmin && alerts ? `Open menu, ${alertsText}` : 'Open menu'}
        aria-expanded={open}
        aria-controls={MENU_ID}
      >
        <Badge variant='dot' color='error' invisible={!isAdmin || !alerts}>
          <MenuOutlined />
        </Badge>
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
          <SlicsMark sx={{ fontSize: '2.4rem', flexShrink: 0 }} />
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
              {firstName && user.driverVerified && <VerifiedBadge color='inherit' />}
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
                href='/hubs'
                label='All Hubs'
                icon={<HubOutlined />}
                current={isCurrent('/hubs')}
              />
              {/* Its name doesn't say what's there, so the row does. */}
              <NavItem
                onClick={handleClose}
                href='/places'
                label='Places'
                secondary={
                  placesIsNew ? 'New · Fuel, food, restrooms' : 'Fuel, food, restrooms'
                }
                icon={<SignpostOutlined />}
                current={isCurrent('/places')}
              />
              {canUseCovers && (
                <NavItem
                  onClick={handleClose}
                  href='/covers'
                  label='Covers'
                  secondary={coversOpen ? undefined : 'Admin only for now'}
                  icon={<EventAvailableOutlined />}
                  current={isCurrent('/covers')}
                />
              )}
              {user.bmcMember && (
                <NavItem
                  onClick={handleClose}
                  href='/history'
                  label='My History'
                  secondary='Member only'
                  icon={<HistoryOutlined />}
                  current={isCurrent('/history')}
                />
              )}
              {/* Admin-only while it's tried out in production. Cover Bids
                  opens to members together with the check in
                  app/cover-bid-jobs/page.jsx. */}
              {user.role === 'admin' && (
                <NavItem
                  onClick={handleClose}
                  href='/cover-bid-jobs'
                  label='Cover Bids'
                  secondary='Admin only for now'
                  icon={<AssignmentOutlined />}
                  current={isCurrent('/cover-bid-jobs')}
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
          {user?.role === 'admin' && (
            <NavItem
              onClick={handleClose}
              href='/admin'
              label='Admin'
              secondary={alerts ? alertsText : 'Admin only'}
              icon={
                <Badge badgeContent={alerts} color='error' max={99}>
                  <AdminPanelSettingsOutlined />
                </Badge>
              }
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
          <NavItem
            onClick={handleClose}
            href='/help'
            label='Help'
            icon={<HelpOutline />}
            current={isCurrent('/help')}
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
              {/* A flex row, so the button grows to fill it inside its
                  margins. `width: 100%` plus the row's mx overflowed the
                  drawer and made it scroll sideways on a phone. */}
              <Box
                component='form'
                action={signOutAction}
                sx={{ display: 'flex', width: '100%' }}
              >
                <ListItemButton
                  component='button'
                  type='submit'
                  sx={rowSx}
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
              href='/sign-in'
              label='Sign in'
              icon={<LoginOutlined />}
              current={isCurrent('/sign-in')}
            />
          )}
        </List>
      </SwipeableDrawer>
    </>
  );
}

export default UserMenu;
