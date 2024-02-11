'use client';

import { ThemeProvider } from '@mui/material/styles';

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
  Button,
} from '@mui/material';

import theme from '../utilities/theme';

import { blogPosts } from './blogPosts';

export default function Blog() {
  const renderedPosts = blogPosts.map(function (item) {
    return (
      <Card
        key={item.name}
        sx={{ maxWidth: '95%', minWidth: '12rem', p: '.5rem', mb: '2rem' }}
      >
        <CardActionArea>
          <CardMedia component='img' image={item.img} />
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography
              variant='h6'
              sx={{
                mt: '.5rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              {item.title}
            </Typography>
            <Typography
              sx={{
                mt: '1rem',
                fontSize: '.85rem',
              }}
            >
              {item.content.split(' ').slice(0, 32).join(' ') + '...'}
            </Typography>
            <Button
              variant='outlined'
              size='small'
              sx={{ fontSize: '.75rem', mt: '1.25rem' }}
            >
              See more
            </Button>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '.75rem',
                mt: '2rem',
              }}
            >
              <Typography sx={{ fontSize: '.75rem' }}>{item.date}</Typography>
              <Typography sx={{ fontSize: '.75rem' }}>
                - {item.author}
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  });

  return (
    <ThemeProvider theme={theme}>
      <Box /* HOME PAGE CONTAINER */
        id='home'
        sx={{
          width: '100vw',
          minHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden',
          pt: '6rem',
          pb: '6rem',
          backgroundColor: theme.palette.background.light,
        }}
      >
        <Typography
          textAlign='center'
          variant='body1'
          fontWeight='600'
          sx={{ m: '1rem 2rem 3rem 2rem', textTransform: 'uppercase' }}
        >
          My Two Cents
        </Typography>
        <Typography
          textAlign='center'
          variant='body1'
          fontWeight='600'
          sx={{ m: '1rem 2rem 3rem 2rem', textTransform: 'uppercase' }}
        >
          Work in Progress
        </Typography>
        {renderedPosts}
      </Box>
    </ThemeProvider>
  );
}
