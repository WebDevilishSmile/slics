'use client';

import { useState } from 'react';
import Image from 'next/image';

import { ThemeProvider } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

import { blogPosts } from './blogPosts';
import BlogArticle from './BlogArticle';

import theme from '../utilities/theme';

export default function Blog() {
  const [openArticle, setOpenArticle] = useState(false);

  function handleOpenArticle(id) {
    setOpenArticle(true);
  }

  function handleCloseArticle() {
    setOpenArticle(false);
  }

  const renderedPosts = blogPosts.map(function (blog) {
    return <BlogArticle blog={blog} key={blog.id} />;
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

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            width: {
              xxs: '90%',
              xs: '90%',
              sm: '60%',
              md: '40%',
            },
            height: 'auto',
          }}
        >
          <Image
            src='/blogs/construction.jpg'
            width={400}
            height={400}
            alt='under construction image'
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '6px',
              boxShadow: '0px 1px 6px rgba(0, 0, 0, .3)',
              marginBottom: '2rem',
            }}
          />
        </Box>

        {renderedPosts}
      </Box>
    </ThemeProvider>
  );
}
