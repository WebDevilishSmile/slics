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
import { useEffect, useState } from 'react';
import { serializeUser } from '@/lib/serializers';
import { softInputSx, softToggleSx } from '@/components/utility/soft';
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

// The search, filters, sort and page live in the URL (?q=&members=1&admins=1
// &sort=&page=), so Back from a user's page lands on the same list. This only
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
    sort: SORT_OPTIONS.some(({ value }) => value === sort) ? sort : DEFAULT_SORT,
    page: Number.isInteger(page) && page > 1 ? page - 1 : 0,
  };
}

function writeView({ q, members, admins, sort, page }) {
  const search = new URLSearchParams();
  if (q) search.set('q', q);
  if (members) search.set('members', '1');
  if (admins) search.set('admins', '1');
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
      (view.admins ? user.role === 'admin' : true) &&
      user.name.toLowerCase().includes(view.q.toLowerCase()),
  );

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
            label='Admins only'
            clickable
            aria-pressed={view.admins}
            sx={softToggleSx}
            onClick={() => update({ admins: !view.admins })}
          />
        </Box>
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
            user={serializeUser(user)}
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
          />
        </Box>
      )}
    </Paper>
  );
}

export default UserList;
