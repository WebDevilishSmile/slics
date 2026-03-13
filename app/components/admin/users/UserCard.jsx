'use client';

import { useState } from 'react';
import { ExpandMore, Person, PersonOff } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import UserEmail from './UserEmail';
import UserMembership from './UserMembership';
import UserPhone from './UserPhone';
import UserRole from './UserRole';

function UserCard({ user: initialUser, viewCount = 0 }) {
  const [user, setUser] = useState(initialUser);
  const router = useRouter();
  const isProtected = user?.email === 'webdevilishsmile@gmail.com';

  if (!user) {
    return (
      <Typography variant='body1' color='error'>
        User not found
      </Typography>
    );
  }

  async function handleMemberToggle() {
    try {
      const response = await fetch(`/api/users/${user._id}/toggle-member`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to toggle membership.');
      if (data.bmcMember !== undefined) {
        setUser(data);
        router.refresh();
      }
    } catch (error) {
      console.error('Error toggling membership:', error);
      alert(`Error: ${error.message}`);
    }
  }

  async function handleRoleToggle() {
    try {
      const response = await fetch(`/api/users/${user._id}/toggle-role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to toggle role.');
      if (data.role) {
        setUser(data);
        router.refresh();
      }
    } catch (error) {
      console.error('Error toggling role:', error);
      alert(`Error: ${error.message}`);
    }
  }

  return (
    <Accordion sx={{ width: '100%' }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            minWidth: 0,
            gap: 1,
          }}
        >
          {/* Name — always visible */}
          <Typography
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexShrink: 1,
              minWidth: 0,
            }}
          >
            {user.name}
          </Typography>

          {/* Cover — hidden on xs */}
          {user.cover && (
            <Typography
              variant='caption'
              sx={{
                display: { xs: 'none', sm: 'block' },
                color: 'text.secondary',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              · Cover {user.cover}
            </Typography>
          )}

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Role chip — hidden on xs, rendered as div to avoid nested <button> */}
          <Chip
            component='div'
            label={user.role}
            size='small'
            color={user.role === 'admin' ? 'primary' : 'default'}
            variant='outlined'
            onClick={(e) => {
              e.stopPropagation();
              if (!isProtected) handleRoleToggle();
            }}
            sx={{
              flexShrink: 0,
              cursor: isProtected ? 'default' : 'pointer',
              display: { xs: 'none', sm: 'flex' },
            }}
          />

          {/* Membership toggle — always visible, rendered as div to avoid nested <button> */}
          <Tooltip title={user.bmcMember ? 'Revoke membership' : 'Grant membership'}>
            <IconButton
              component='div'
              size='small'
              onClick={(e) => { e.stopPropagation(); handleMemberToggle(); }}
              disabled={isProtected}
              sx={{ flexShrink: 0 }}
            >
              {user.bmcMember ? <Person fontSize='small' /> : <PersonOff fontSize='small' />}
            </IconButton>
          </Tooltip>

          {/* Lookup count — abbreviated on xs */}
          <Typography
            variant='caption'
            sx={{ flexShrink: 0, color: 'text.secondary', pr: 1, whiteSpace: 'nowrap' }}
          >
            <Box component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {viewCount} lookup{viewCount !== 1 ? 's' : ''}
            </Box>
            <Box component='span' sx={{ display: { xs: 'inline', sm: 'none' } }}>
              {viewCount}
            </Box>
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        <Box
          sx={{
            position: 'relative',
            width: '100px',
            height: '100px',
            marginRight: '1rem',
            borderRadius: '50%',
            overflow: 'hidden',
            mb: '1rem',
          }}
        >
          <Image
            src={user.image || '/default-avatar.png'}
            alt={user.name}
            width={100}
            height={100}
          />
        </Box>
        <Typography>Joined: {dayjs(user.created_at).format('MMMM D, YYYY')}</Typography>
        <UserMembership user={user} onToggle={handleMemberToggle} />
        <UserRole user={user} onToggle={handleRoleToggle} />
        <UserEmail email={user.email} />
        {user.phone ? (
          <UserPhone phone={user.phone} />
        ) : (
          <Typography>Phone: Not provided</Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default UserCard;
