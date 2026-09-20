'use client';

import theme from '@/utils/theme';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { serializeUser } from '@/utils/functions';
import UserCard from './UserCard';

const USERS_PER_PAGE = 10;

function UserList({ users, viewCounts = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState(false);
  const [admins, setAdmins] = useState(false);
  const [sortBy, setSortBy] = useState('most-lookups');
  const [page, setPage] = useState(0);

  // Reset to page 0 whenever filters or sort change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, members, admins, sortBy]);

  const filteredUsers = users.filter(
    (user) =>
      (members ? user.bmcMember : true) &&
      (admins ? user.role === 'admin' : true) &&
      user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
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
  const pagedUsers = sortedUsers.slice(
    page * USERS_PER_PAGE,
    (page + 1) * USERS_PER_PAGE,
  );

  return (
    <Box sx={{ maxWidth: theme.layout.width.panel, width: '100%', p: 2 }}>
      {/* Search */}
      <TextField
        placeholder='Search users...'
        fullWidth
        sx={{ mb: 2 }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Filters + Sort */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { sm: 'center' },
          flexWrap: 'wrap',
          gap: 1,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={members}
                onChange={() => setMembers((p) => !p)}
              />
            }
            label='Members Only'
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={admins}
                onChange={() => setAdmins((p) => !p)}
              />
            }
            label='Admins Only'
          />
        </Box>
        <FormControl
          size='small'
          sx={{
            width: { xs: '100%', sm: 'auto' },
            minWidth: 160,
            ml: { sm: 'auto' },
          }}
        >
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            label='Sort by'
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value='name-asc'>Name A → Z</MenuItem>
            <MenuItem value='name-desc'>Name Z → A</MenuItem>
            <MenuItem value='joined-newest'>Newest joined</MenuItem>
            <MenuItem value='joined-oldest'>Oldest joined</MenuItem>
            <MenuItem value='members-first'>Members first</MenuItem>
            <MenuItem value='non-members-first'>Non-members first</MenuItem>
            <MenuItem value='most-lookups'>Most lookups</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Result count */}
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ mb: 1, display: 'block' }}
      >
        {sortedUsers.length} user{sortedUsers.length !== 1 ? 's' : ''}
      </Typography>

      {/* User cards */}
      <Box sx={{ width: '100%', minWidth: 0 }}>
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
            onChange={(_, val) => setPage(val - 1)}
            color='primary'
          />
        </Box>
      )}
    </Box>
  );
}

export default UserList;
