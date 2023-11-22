import {
  Avatar,
  Box,
  Button,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';

import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import EditNoteIcon from '@mui/icons-material/EditNote';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Image from 'next/image';

export default async function Profile() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userName = session?.user.user_metadata.name.split(' ')[0];

  let { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('user', userName);

  const comment = comments.map((com) => {
    return (
      <Box
        key={com.id}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          bgcolor: '#f7f7f7',
          p: '.5rem',
          m: '1rem 0',
          borderRadius: '6px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Avatar src={`${user.user_metadata.picture}`} />
          <Typography
            variant="body1"
            fontWeight="700"
            sx={{ textTransform: 'uppercase' }}
          >
            {com.title}
          </Typography>
          <Typography
            variant="body1"
            fontWeight="400"
            sx={{ textTransform: 'uppercase' }}
          >
            {com.numSlic}
          </Typography>
        </Box>
        <Box sx={{ p: '1rem .5rem' }}>
          <Typography>{com.comment}</Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: '1rem',
            }}
          >
            <Typography>{com.created_at}</Typography>
            <Box>
              <IconButton>
                <ArrowCircleUpIcon />
              </IconButton>
              {com.votes}
              <IconButton>
                <ArrowCircleDownIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  });

  return (
    <Box /* HOME PAGE CONTAINER */
      id="home"
      sx={{
        width: '100vw',
        minHeight: '100rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        pt: '6rem',
        bgcolor: '#ebe8e8',
      }}
    >
      {session ? (
        <Paper sx={{ width: '90%', maxWidth: '40rem', p: '1rem' }}>
          <Typography variant="h5" textAlign="center">
            Profile
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              m: '1rem',
            }}
          >
            <Typography>User Name:</Typography>
            <Typography>{user.user_metadata.name}</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              m: '1rem',
            }}
          >
            <Typography>Email:</Typography>
            <Typography>{user.email}</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              m: '1rem',
            }}
          >
            <Typography>Avatar:</Typography>
            <Avatar src={`${user.user_metadata.picture}`} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', m: '1rem' }}>
            <Typography sx={{ mb: '1rem' }}>Comments:</Typography>
            {comment}
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ width: '90%', height: '20rem', p: '1rem' }}></Paper>
      )}
    </Box>
  );
}
