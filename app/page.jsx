import { auth } from '@/auth';
import { getAllSlics } from '@/utils/slicsApi';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from '@mui/material';
import { redirect } from 'next/navigation';

import { getCommentsBySlic } from '@/utils/commentsApi';
import { MAX_WIDTH } from '@/utils/variables';
import Image from 'next/image';
import PageContainer from './components/layout/PageContainer';

export default async function Main({ searchParams }) {
  return (
    <PageContainer>
      <Typography variant='h1'>SLICs</Typography>

      <Typography>
        To use SLICs you must be a member of Buy Me a Coffee
      </Typography>

      <Card sx={{ maxWidth: MAX_WIDTH, mt: '2rem' }}>
        <Box
          sx={{
            position: 'relative',
            height: '10rem',
            bgcolor: 'white',
          }}
        >
          <Image
            fill
            src='/bmc-brand-logo.svg'
            alt='Buy Me a Coffee'
            style={{
              objectFit: 'contain',
              padding: '1rem',
            }}
          />
        </Box>
        <CardContent sx={{ px: '2rem', py: '1rem' }}>
          <Typography>
            Buy Me a Coffee is a platform that allows you to support creators by
            making small donations. With a subscription, you can access all of
            the SLICs app features. This subscription fee helps support the
            developer's efforts to maintain the app and add new features.
          </Typography>
        </CardContent>

        <CardActions
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            px: '2rem',
            pb: '2rem',
          }}
        >
          <Button variant='contained'>Sign Up</Button>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '.25rem',
            }}
          >
            <Button href='/signin' variant='contained'>
              Sign In
            </Button>

            <Typography variant='body2'>Already a member?</Typography>
          </Box>
        </CardActions>
      </Card>
    </PageContainer>
  );
}
