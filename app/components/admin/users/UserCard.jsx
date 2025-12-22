// src/components/UserCard.jsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  Table,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';

import UserEmail from './UserEmail';
import UserPhone from './UserPhone';
import UserRole from './UserRole';
import UserMembership from './UserMembership';

function UserCard({ user: initialUser }) {
  const [user, setUser] = useState(initialUser);

  if (!user) {
    return (
      <Typography variant='body1' color='error'>
        User not found
      </Typography>
    );
  }

  return (
    <Accordion key={user._id.toString()} sx={{ width: '100%' }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            minWidth: 0, // Crucial for allowing the flex item to shrink below its content size
          }}
        >
          <Typography
            sx={{
              whiteSpace: 'nowrap',
              flexShrink: 0, // Prevents name from shrinking, ensuring full content width
            }}
          >
            {user.name}
          </Typography>

          <Divider orientation='vertical' flexItem sx={{ mx: 2 }} />

          {user.cover && (
            <Typography
              sx={{
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Cover {user.cover}
            </Typography>
          )}
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
        <Typography>
          Joined: {dayjs(user.created_at).format('MMMM D, YYYY')}
        </Typography>
        <UserMembership user={user} />
        <UserRole role={user.role} user={user} />
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
