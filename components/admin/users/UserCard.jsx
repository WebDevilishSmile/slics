'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ExpandMore, KeyOutlined, Person } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from '@/components/utility/NextLink';

import { softPressSx, softRaised, softRaisedSmall } from '@/components/utility/soft';
import ResetPasswordDialog from './ResetPasswordDialog';
import UserEmail from './UserEmail';
import UserMembership from './UserMembership';
import UserPhone from './UserPhone';
import UserRole from './UserRole';
import VerifiedBadge from '@/components/utility/VerifiedBadge';
import { STAFF_ROLES } from '@/constants';

function UserCard({ user: initialUser, viewCount = 0 }) {
  const [user, setUser] = useState(initialUser);
  const router = useRouter();
  const { data: session } = useSession();
  const isProtected = user?._id?.toString() === session?.user?.id?.toString();
  // Only a super admin changes roles, never their own or another super admin's
  // (lib/db/admins.js).
  const canChangeRole =
    session?.user?.superAdmin === true && !isProtected && user?.superAdmin !== true;
  // Reset links (docs/PASSWORD-RESET.md): password accounts only, never your
  // own; a staff account's (admin or dispatch) only from a super admin, and
  // never a super admin's. The route checks the same.
  const canResetPassword =
    user?.hasPassword === true &&
    !isProtected &&
    user?.superAdmin !== true &&
    (!STAFF_ROLES.includes(user?.role) || session?.user?.superAdmin === true);
  const [resetOpen, setResetOpen] = useState(false);

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
      if (!response.ok)
        throw new Error(data.error || 'Failed to toggle membership.');
      if (data.bmcMember !== undefined) {
        setUser((current) => ({ ...current, bmcMember: data.bmcMember }));
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
      if (!response.ok)
        throw new Error(data.error || 'Failed to toggle role.');
      if (data.role) {
        setUser((current) => ({ ...current, role: data.role }));
        router.refresh();
      }
    } catch (error) {
      console.error('Error toggling role:', error);
      alert(`Error: ${error.message}`);
    }
  }

  return (
    <Accordion
      disableGutters
      elevation={0}
      square={false}
      sx={[
        softRaised,
        {
          width: '100%',
          borderRadius: 3,
          '&::before': { display: 'none' },
          '&.Mui-expanded': { margin: 0 },
          '&:first-of-type, &:last-of-type': { borderRadius: 3 },
        },
      ]}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        // Lets the row shrink to the card, so a long name ends in "…"
        // instead of pushing the row past both edges.
        sx={{ '& .MuiAccordionSummary-content': { minWidth: 0 } }}
      >
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
            {user.driverVerified && <VerifiedBadge />}
          </Typography>

          {/* Cover — hidden on xs */}
          {/* {user.cover && (
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
          )} */}

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Role chip — hidden on xs, rendered as div to avoid nested <button> */}
          <Chip
            component='div'
            label={user.superAdmin ? 'super admin' : user.role}
            onClick={(e) => {
              e.stopPropagation();
              if (canChangeRole) handleRoleToggle();
            }}
            sx={[
              softRaisedSmall,
              {
                flexShrink: 0,
                cursor: canChangeRole ? 'pointer' : 'default',
                display: { xs: 'none', sm: 'flex' },
                color: user.role === 'admin' ? 'primary.main' : 'text.primary',
                fontWeight: user.role === 'admin' ? 600 : 400,
              },
            ]}
          />

          {/* Members get a labeled badge (UI-SUGGESTIONS.md #57); most users
              aren't, so non-members show nothing. Granting and revoking is in
              the details below, so a tap while scrolling can't change it. */}
          {user.bmcMember && (
            <Chip
              size='small'
              icon={<Person />}
              label='Member'
              sx={[
                softRaisedSmall,
                {
                  flexShrink: 0,
                  color: 'primary.main',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: 'primary.main' },
                },
              ]}
            />
          )}

          {/* Lookup count, with its label at every width: the number, and
              "lookups" under it in small type so it fits on a phone. */}
          <Box
            sx={{
              flexShrink: 0,
              pr: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: 1.1,
            }}
          >
            <Typography variant='body2' component='span' sx={{ fontWeight: 600, lineHeight: 'inherit' }}>
              {viewCount}
            </Typography>
            <Typography
              variant='caption'
              component='span'
              sx={{ color: 'text.secondary', lineHeight: 'inherit' }}
            >
              lookup{viewCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        <Box
          sx={{
            position: 'relative',
            width: '100px',
            height: '100px',
            marginRight: 2,
            borderRadius: '50%',
            overflow: 'hidden',
            mb: 2,
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
        <UserMembership user={user} onToggle={handleMemberToggle} disabled={isProtected} />
        <UserRole user={user} onToggle={handleRoleToggle} canToggle={canChangeRole} />
        <UserEmail email={user.email} />
        {user.phone ? (
          <UserPhone phone={user.phone} />
        ) : (
          <Typography>Phone: Not provided</Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
          {canResetPassword && (
            <Button
              onClick={() => setResetOpen(true)}
              startIcon={<KeyOutlined />}
              sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
            >
              Reset password
            </Button>
          )}
          <Button
            LinkComponent={Link}
            href={`/admin/users/${user._id}`}
            sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
          >
            More...
          </Button>
        </Box>
      </AccordionDetails>

      {canResetPassword && (
        <ResetPasswordDialog open={resetOpen} onClose={() => setResetOpen(false)} user={user} />
      )}
    </Accordion>
  );
}

export default UserCard;
