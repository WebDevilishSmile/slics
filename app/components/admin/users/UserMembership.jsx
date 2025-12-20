import { Person, PersonOff } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function UserMembership({ user: initialUser }) {
  const [user, setUser] = useState(initialUser);
  const router = useRouter();

  async function handleMemberChange() {
    try {
      const response = await fetch(`/api/users/${user._id}/toggle-member`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json(); // Always parse, then check response.ok

      if (!response.ok) {
        // If server returned an error status (e.g., 400, 401, 403, 500)
        throw new Error(
          responseData.message || 'Failed to toggle role on server.'
        );
      }

      // If response.ok is true, check if an actual membership change occurred or just an info message
      if (responseData.bmcMember !== undefined) {
        setUser(responseData); // Update local state with the new membership status
        router.refresh(); // Revalidate data for the current route
      } else if (responseData.message) {
        // This case is for when the membership was already the target status, and API returned a message
        console.log('API Info:', responseData.message);
        alert(`Info: ${responseData.message}`); // Inform the user
      } else {
        // Fallback for unexpected successful response without membership status or message
        console.warn(
          'API returned success but no user object or message:',
          responseData
        );
        alert('Membership operation completed, but response was unexpected.');
      }
    } catch (error) {
      console.error('Error toggling membership:', error);
      alert(`Error: ${error.message}`);
    }
  }
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Typography variant='subtitle1'>
        Membership: {user.bmcMember ? 'Active' : 'Inactive'}
      </Typography>
      <IconButton
        onClick={handleMemberChange}
        disabled={user.email === 'webdevilishsmile@gmail.com'}
      >
        {user.bmcMember ? <Person /> : <PersonOff />}
      </IconButton>
    </Box>
  );
}

export default UserMembership;
