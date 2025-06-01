import { ELEVATION, MAX_WIDTH } from '@/utils/variables';
import { MoreVert } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import Image from 'next/image';
import UserCardActions from './UserCardActions';
import { serializeUser } from '@/utils/functions';

function UserCard({ user }) {
  return (
    <Card
      key={user._id}
      sx={{ mb: '1rem', maxWidth: MAX_WIDTH, width: '100%' }}
    >
      <CardContent
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <UserCardActions user={serializeUser(user)} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: '1rem',
            gap: '3rem',
          }}
        >
          <Typography variant='h5'>{user.name}</Typography>
          <Paper
            elevation={ELEVATION}
            sx={{
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              mb: '1rem',
              borderRadius: '100%',
              overflow: 'hidden',
            }}
          >
            <Image
              src={user.image || '/default-avatar.png'}
              alt={user.name}
              width={100}
              height={100}
            />
          </Paper>
        </Box>
        <Typography variant='subtitle1'>Role: {user.role}</Typography>
        <Typography>Email: {user.email}</Typography>
        <Typography>
          Joined: {dayjs(user.created_at).format('MMMM D, YYYY')}
        </Typography>
        <Typography>
          BuyMeACoffee:{' '}
          <strong>{user.bmcMember ? 'Member' : 'Not a member'}</strong>
        </Typography>
      </CardContent>
    </Card>
  );
}

export default UserCard;
