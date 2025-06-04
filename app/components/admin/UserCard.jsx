// src/components/UserCard.jsx
'use client';

import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function UserCard({ user: initialUser }) {
  const [user, setUser] = useState(initialUser);
  const router = useRouter();

  if (!user) {
    return (
      <Typography variant='body1' color='error'>
        User not found
      </Typography>
    );
  }

  const toggleMembership = async () => {
    try {
      const response = await fetch(`/api/users/${user._id}/toggle-membership`, {
        method: 'PATCH', // Use PATCH method as defined in your API route
        headers: {
          'Content-Type': 'application/json',
        },
        // No body needed for this specific API as userId is in the URL
      });

      if (!response.ok) {
        // Handle API errors (e.g., 401, 403, 404, 500)
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle membership');
      }

      const updatedUser = await response.json(); // Parse the updated user data

      if (updatedUser) {
        console.log('Membership status updated:', updatedUser);
        setUser(updatedUser); // Update local state
        router.refresh(); // Revalidate data for the current route
      } else {
        console.error(
          'Failed to update membership status: No user data returned from API.'
        );
      }
    } catch (error) {
      console.error('Error toggling membership:', error);
      alert(`Error: ${error.message}`); // Simple alert for user feedback
    }
  };

  return (
    <Accordion key={user._id.toString()}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography>
          {user.name} - {user.email}
        </Typography>
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
        <Typography variant='subtitle1'>Role: {user.role}</Typography>
        <Typography>Email: {user.email}</Typography>
        <Typography>
          Joined: {dayjs(user.createdAt).format('MMMM D, YYYY')}
        </Typography>
        <Typography>
          BuyMeACoffee:{' '}
          <strong>{user.bmcMember ? 'Member' : 'Not a member'}</strong>
        </Typography>
        {user.role === 'user' && ( // Only show button for regular users
          <Button
            variant='contained'
            sx={{ mt: '1rem' }}
            onClick={toggleMembership}
          >
            Toggle Membership
          </Button>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default UserCard;
