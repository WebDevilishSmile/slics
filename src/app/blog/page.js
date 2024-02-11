'use client';

import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';

import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
} from '@mui/material';

import theme from '../utilities/theme';

import { blogPosts } from './blogPosts';

import BlogArticle from './BlogArticle';
import Image from 'next/image';

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

        <Image
          src='/blogs/construction.jpg'
          width={400}
          height={400}
          alt='under construction image'
          style={{
            width: '90%',
            height: 'auto',
            borderRadius: '6px',
            boxShadow: '0px 1px 6px rgba(0, 0, 0, .3)',
            marginBottom: '2rem',
          }}
        />
        {renderedPosts}
      </Box>
    </ThemeProvider>
  );
}
