'use client';

import { SearchOutlined } from '@mui/icons-material';
import {
  Box,
  Chip,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { softInputSx, softToggleSx } from '@/components/utility/soft';
import { STAFF_ROLES } from '@/constants';
import { homeBaseLabel } from '@/lib/homeBase';
import UserCard from './UserCard';

const USERS_PER_PAGE = 10;

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name A → Z' },
  { value: 'name-desc', label: 'Name Z → A' },
  { value: 'joined-newest', label: 'Newest joined' },
  { value: 'joined-oldest', label: 'Oldest joined' },
  { value: 'members-first', label: 'Members first' },
  { value: 'non-members-first', label: 'Non-members first' },
  { value: 'most-lookups', label: 'Most lookups' },
];
const DEFAULT_SORT = 'most-lookups';

// The home building filter (docs/MULTI-HUB.md "Home base", step 4): every
// account, the ones SLICs can't place, buildings drivers typed in that the
// All Hubs list doesn't have, the changes waiting for an admin, or one
// building by its alpha code and number ("BETPA 1809").
const HOME_ALL = '';
const HOME_FIXED = [
  { value: 'none', label: 'Not answered', test: (user) => !user.homeBase },
  { value: 'unlisted', label: 'Not on the list', test: (user) => user.homeBase?.listed === false },
  { value: 'asked', label: 'Change asked', test: (user) => Boolean(user.homeBaseRequest) },
];
const buildingKey = (homeBase) => `${homeBase.alphaSlic} ${homeBase.numSlic}`;
const homeTest = (value) =>
  HOME_FIXED.find((option) => option.value === value)?.test ??
  ((user) => Boolean(user.homeBase) && buildingKey(user.homeBase) === value);

// The search, filters, sort and page live in the URL (?q=&members=1&admins=1
// &verified=1&home=&sort=&page=), so Back from a user's page lands on the same list. This only
// renders on the client (HydrationGuard), so it reads the address bar itself:
// that's right even when Back restores a cached server render.
function readView() {
  const search = new URLSearchParams(window.location.search);
  const sort = search.get('sort');
  const page = Number(search.get('page'));
  return {
    q: search.get('q') ?? '',
    members: search.get('members') === '1',
    admins: search.get('admins') === '1',
    verified: search.get('verified') === '1',
    home: search.get('home') ?? HOME_ALL,
    sort: SORT_OPTIONS.some(({ value }) => value === sort) ? sort : DEFAULT_SORT,
    page: Number.isInteger(page) && page > 1 ? page - 1 : 0,
  };
}

function writeView({ q, members, admins, verified, home, sort, page }) {
  const search = new URLSearchParams();
  if (q) search.set('q', q);
  if (members) search.set('members', '1');
  if (admins) search.set('admins', '1');
  if (verified) search.set('verified', '1');
  if (home) search.set('home', home);
  if (sort !== DEFAULT_SORT) search.set('sort', sort);
  if (page > 0) search.set('page', String(page + 1));
  const query = search.toString();
  const { pathname } = window.location;
  // replaceState, not push: a keystroke shouldn't be a Back step.
  window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname);
}

function UserList({ users, viewCounts = {} }) {
  const [view, setView] = useState(readView);

  useEffect(() => {
    writeView(view);
  }, [view]);

  // Any change but paging starts over from the first page.
  const update = (changes) =>
    setView((current) => ({ ...current, page: 0, ...changes }));

  const filteredUsers = users.filter(
    (user) =>
      (view.members ? user.bmcMember : true) &&
      // `admins`: staff, admins and dispatch (docs/archive/STAFF-ROLES.md); the URL
      // keeps its old name so saved links still work.
      (view.admins ? STAFF_ROLES.includes(user.role) : true) &&
      (view.verified ? user.driverVerified : true) &&
      (view.home ? homeTest(view.home)(user) : true) &&
      user.name.toLowerCase().includes(view.q.toLowerCase()),
  );

  // The filter's choices with how many accounts each has; buildings by count.
  const homeOptions = useMemo(() => {
    const buildings = new Map();
    for (const user of users) {
      if (!user.homeBase) continue;
      const key = buildingKey(user.homeBase);
      const entry = buildings.get(key) ?? { value: key, label: homeBaseLabel(user.homeBase), count: 0 };
      entry.count += 1;
      buildings.set(key, entry);
    }
    return [
      { value: HOME_ALL, label: 'Every building', count: users.length },
      ...HOME_FIXED.map(({ value, label, test }) => ({ value, label, count: users.filter(test).length })),
      ...[...buildings.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    ];
  }, [users]);

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (view.sort) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'joined-newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'joined-oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'members-first':
        return (b.bmcMember ? 1 : 0) - (a.bmcMember ? 1 : 0);
      case 'non-members-first':
        return (a.bmcMember ? 1 : 0) - (b.bmcMember ? 1 : 0);
      case 'most-lookups':
        return (viewCounts[b._id] ?? 0) - (viewCounts[a._id] ?? 0);
      default:
        return 0;
    }
  });

  const pageCount = Math.ceil(sortedUsers.length / USERS_PER_PAGE);
  // A page from the URL can outlast the users on it.
  const page = Math.min(view.page, Math.max(0, pageCount - 1));
  const pagedUsers = sortedUsers.slice(
    page * USERS_PER_PAGE,
    (page + 1) * USERS_PER_PAGE,
  );

  return (
    <Paper
      variant='panel'
      sx={{ alignItems: 'stretch', minHeight: 0, px: { xs: 2, sm: 3 } }}
    >
      {/* Search */}
      <TextField
        placeholder='Search users'
        aria-label='Search users'
        fullWidth
        sx={[softInputSx, { mb: 2 }]}
        value={view.q}
        onChange={(e) => update({ q: e.target.value })}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <SearchOutlined />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Filters + Sort */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Chip
            size='medium'
            label='Members only'
            clickable
            aria-pressed={view.members}
            sx={softToggleSx}
            onClick={() => update({ members: !view.members })}
          />
          <Chip
            size='medium'
            label='Staff only'
            clickable
            aria-pressed={view.admins}
            sx={softToggleSx}
            onClick={() => update({ admins: !view.admins })}
          />
          <Chip
            size='medium'
            label='Verified drivers'
            clickable
            aria-pressed={view.verified}
            sx={softToggleSx}
            onClick={() => update({ verified: !view.verified })}
          />
        </Box>
        <TextField
          select
          fullWidth
          label='Home building'
          value={homeOptions.some((option) => option.value === view.home) ? view.home : HOME_ALL}
          onChange={(e) => update({ home: e.target.value })}
          sx={softInputSx}
        >
          {homeOptions.map(({ value, label, count }) => (
            <MenuItem key={value || 'all'} value={value}>
              {label} ({count})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          fullWidth
          label='Sort by'
          value={view.sort}
          onChange={(e) => update({ sort: e.target.value })}
          sx={softInputSx}
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Result count */}
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ mb: 1.5, display: 'block' }}
      >
        {sortedUsers.length} user{sortedUsers.length !== 1 ? 's' : ''}
      </Typography>

      {/* User cards */}
      <Box
        sx={{
          width: '100%',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {pagedUsers.map((user) => (
          <UserCard
            key={user._id}
            user={user}
            viewCount={viewCounts[user._id] ?? 0}
          />
        ))}
      </Box>

      {/* Pagination */}
      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pageCount}
            page={page + 1}
            onChange={(_, val) => update({ page: val - 1 })}
            color='primary'
            // Just the current page between the first and last, so the
            // arrows stay on one line at phone width.
            siblingCount={0}
          />
        </Box>
      )}
    </Paper>
  );
}

export default UserList;
