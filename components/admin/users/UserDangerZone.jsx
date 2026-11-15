'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Typography } from '@mui/material';

import DeleteUserDialog from '@/components/admin/users/DeleteUserDialog';
import { softInset, softPressSx, softRaisedSmall } from '@/components/utility/soft';

// The bottom of /admin/users/[id], drawn only for the super admin
// (docs/ADMIN-USER-DELETION.md). A driver's account gets "Delete account…";
// staff get the reason they can't be deleted yet. The page leaves it out for
// the super admin's own account and another super admin's. The route checks
// all of it again.
export default function UserDangerZone({ userId, name, email, role = 'user', commentCount = 0, viewCount = 0 }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isDriver = (role || 'user') === 'user';

  return (
    <Box
      sx={[
        softInset,
        { alignSelf: 'stretch', borderRadius: 4, p: 2, mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 },
      ]}
    >
      <Typography variant='subtitle2' component='h2' color='error'>
        Danger zone
      </Typography>
      {isDriver ? (
        <>
          <Typography variant='body2' color='text.secondary'>
            Delete this account and everything tied to it. It can&apos;t be undone.
          </Typography>
          <Button
            color='error'
            onClick={() => setOpen(true)}
            sx={[softRaisedSmall, softPressSx, { alignSelf: 'flex-start', px: 3, minHeight: '3rem' }]}
          >
            Delete account…
          </Button>
          <DeleteUserDialog
            open={open}
            onClose={() => setOpen(false)}
            onDeleted={() => {
              router.replace('/admin/users');
              router.refresh();
            }}
            userId={userId}
            name={name}
            email={email}
            commentCount={commentCount}
            viewCount={viewCount}
          />
        </>
      ) : (
        <Typography variant='body2' color='text.secondary'>
          To delete this account, change their role to Driver first.
        </Typography>
      )}
    </Box>
  );
}
