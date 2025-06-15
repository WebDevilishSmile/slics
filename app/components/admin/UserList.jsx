'use client';

import { MAX_WIDTH } from '@/utils/variables';
import {
  Box,
  Checkbox,
  FormControlLabel,
  List,
  TextField,
} from '@mui/material';
import UserCard from './UserCard';
import { serializeUser } from '@/utils/functions';
import { useState } from 'react';

function UserList({ users }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState(false);
  const [admins, setAdmins] = useState(false);
  const filteredUsers = users.filter(
    (user) =>
      (members ? user.bmcMember : true) &&
      (admins ? user.role === 'admin' : true) &&
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
  }

  function handleMemberView() {
    setMembers((prev) => !prev);
  }

  function handleAdminView() {
    setAdmins((prev) => !prev);
  }

  return (
    <Box sx={{ maxWidth: MAX_WIDTH, width: '100%', p: '1rem' }}>
      <TextField
        placeholder='Search users...'
        fullWidth
        sx={{ mb: '1rem' }}
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <Box>
        <FormControlLabel
          control={<Checkbox />}
          label='Members Only'
          checked={members}
          onChange={handleMemberView}
        />
        <FormControlLabel
          control={<Checkbox />}
          label='Admins Only'
          checked={admins}
          onChange={handleAdminView}
        />
      </Box>

      <List
        sx={{ maxWidth: MAX_WIDTH, width: '100%', minWidth: 0, mt: '2rem' }}
      >
        {filteredUsers.map((user) => (
          <UserCard key={user._id} user={serializeUser(user)} />
        ))}
      </List>
    </Box>
  );
}

export default UserList;
