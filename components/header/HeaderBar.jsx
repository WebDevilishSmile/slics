'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowBack } from '@mui/icons-material';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useScrollTrigger,
} from '@mui/material';

import SlicsMark from '@/components/utility/SlicsMark';

import NavigationProgress from './NavigationProgress';
import UserMenu from './UserMenu';

// The page name shown next to the back arrow, by path prefix (the longest
// match wins). /home and the sign-in page have none: they're the app's top
// level, so there's nothing to go back to.
const PAGE_TITLES = [
  ['/home/', 'SLIC'],
  ['/about', 'About'],
  ['/help', 'Help'],
  ['/reset-password', 'Reset Password'],
  ['/sign-in', 'Sign in'],
  ['/hubs', 'All Hubs'],
  ['/history', 'History'],
  ['/profile', 'Profile'],
  ['/privacy', 'Privacy Policy'],
  ['/terms', 'Terms of Service'],
  ['/covers', 'Covers'],
  ['/cover-bid-jobs', 'Cover Bids'],
  ['/places', 'Places'],
  ['/admin/slics', 'SLICs'],
  ['/admin/new', 'New SLIC'],
  ['/admin/edit', 'Edit SLIC'],
  ['/admin/comments', 'Comments'],
  ['/admin/reports', 'SLIC Reports'],
  ['/admin/driver-claims', 'Driver Claims'],
  ['/admin/users', 'Users'],
  ['/admin/super/supporters', 'Supporters'],
  ['/admin/super/admins', 'Admins'],
  ['/admin/super', 'Super Admin'],
  ['/admin/drivers', 'Drivers'],
  ['/admin/cover/drivers', 'Cover Drivers'],
  ['/admin/cover/jobs', 'Cover Jobs'],
  ['/admin/cover/lists', 'Cover Lists'],
  ['/admin/jobs', 'Jobs'],
  ['/admin/planet-fitness', 'Planet Fitness'],
  ['/admin', 'Admin'],
];

const titleFor = (pathname) =>
  PAGE_TITLES.filter(([prefix]) => pathname.startsWith(prefix)).sort(
    (a, b) => b[0].length - a[0].length,
  )[0]?.[1] ?? null;

// How many in-app navigations this tab has made. The back arrow only uses
// the browser's Back when the previous page was ours; a page opened from a
// link or a cold start goes home instead of leaving the app.
let inAppNavigations = -1;

// The app header (UI-SUGGESTIONS.md #52): the menu, then on a sub-page a back
// arrow and the page name, and the logo linking home. It's flat at the top of
// the page and lifts with a soft shadow once content scrolls under it.
export default function HeaderBar({ user, signOutAction }) {
  const pathname = usePathname();
  const router = useRouter();
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 0 });
  const title = titleFor(pathname);

  useEffect(() => {
    inAppNavigations += 1;
  }, [pathname]);

  // Home is the lookup page when signed in, the sign-in page otherwise.
  const home = user ? '/home' : '/';
  const goBack = () => {
    if (inAppNavigations > 0) router.back();
    else router.push(home);
  };

  return (
    <AppBar
      elevation={0}
      sx={(theme) => ({
        transition: theme.transitions.create('box-shadow', {
          duration: theme.transitions.duration.short,
        }),
        ...(scrolled && {
          boxShadow: theme.soft.raised.light,
          ...theme.applyStyles('dark', { boxShadow: theme.soft.raised.dark }),
        }),
      })}
    >
      <Toolbar sx={{ gap: 0.5 }}>
        <UserMenu user={user} signOutAction={signOutAction} />

        {title && (
          <>
            <IconButton
              onClick={goBack}
              aria-label='Back'
              // On the blue header the focus outline takes the icon's color.
              sx={{ color: 'text.light', '&.Mui-focusVisible': { outlineColor: 'currentColor' } }}
            >
              <ArrowBack />
            </IconButton>
            <Typography
              variant='h6'
              component='p'
              noWrap
              sx={{ color: 'text.light', fontWeight: 700, minWidth: 0 }}
            >
              {title}
            </Typography>
          </>
        )}

        <Box
          component={Link}
          href={home}
          aria-label='SLICs home'
          sx={{
            display: 'grid',
            placeItems: 'center',
            height: '2.4rem',
            width: '2.4rem',
            ml: 'auto',
            flexShrink: 0,
            color: 'text.light',
            borderRadius: 2,
            '&:focus-visible': { outline: '2px solid currentColor', outlineOffset: '2px' },
          }}
        >
          <SlicsMark sx={{ fontSize: '2rem' }} />
        </Box>
      </Toolbar>
      {/* useSearchParams needs a Suspense boundary on static pages. */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
    </AppBar>
  );
}
