import { AccountCircle, VerifiedUser } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function UserRole({ role, user: initialUser }) {
  const [user, setUser] = useState(initialUser);
  const router = useRouter();

  // If user is not provided, render nothing or an error message
  if (!user || !user._id) {
    return null; // Or return <Typography color="error">User data missing</Typography>;
  }

  async function handleRoleChange() {
    try {
      const response = await fetch(`/api/users/${user._id}/toggle-role`, {
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

      // If response.ok is true, check if an actual role change occurred or just an info message
      if (responseData.role) {
        setUser(responseData); // Update local state with the new role
        router.refresh(); // Revalidate data for the current route
      } else if (responseData.message) {
        // This case is for when the role was already the target role, and API returned a message
        console.log('API Info:', responseData.message);
        alert(`Info: ${responseData.message}`); // Inform the user
      } else {
        // Fallback for unexpected successful response without role or message
        console.warn(
          'API returned success but no user object or message:',
          responseData
        );
        alert('Role operation completed, but response was unexpected.');
      }
    } catch (error) {
      console.error('Error toggling role:', error);
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
      <Typography variant='subtitle1'>Role: {user.role}</Typography>
      <IconButton
        onClick={handleRoleChange}
        disabled={user.email === 'webdevilishsmile@gmail.com'}
      >
        {user.role === 'admin' ? <VerifiedUser /> : <AccountCircle />}
      </IconButton>
    </Box>
  );
}

export default UserRole;
