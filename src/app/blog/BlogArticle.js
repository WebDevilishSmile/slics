import { useState } from 'react';

import Image from 'next/image';

import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Modal,
  Typography,
} from '@mui/material';

import { Close } from '@mui/icons-material';

import theme from '../utilities/theme';

export default function BlogArticle({ children, blog }) {
  const [open, setOpen] = useState(false);

  function handleOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <Card
      key={blog.title}
      sx={{
        width: '95%',
        maxWidth: '40rem',
        minWidth: '12rem',
        p: '.5rem',
        mb: '2rem',
      }}
    >
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
          {blog.title}
        </Typography>
        <Typography
          sx={{
            mt: '1rem',
            fontSize: '.85rem',
          }}
        >
          {blog.content[0].data.split(' ').slice(0, 32).join(' ') + '...'}
        </Typography>
        <Button
          onClick={handleOpen}
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
          <Typography sx={{ fontSize: '.75rem' }}>{blog.date}</Typography>
          <Typography sx={{ fontSize: '.75rem' }}>- {blog.author}</Typography>
        </Box>
      </CardContent>

      <Modal open={open} onClose={handleClose} sx={{ overflow: 'auto' }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: '40rem',
            minHeight: '100%',
            p: '.5rem .25rem 15rem .25rem',
            background: theme.palette.background.light,
            margin: 'auto',
          }}
        >
          <Box
            sx={{
              top: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              mb: '.5rem',
            }}
          >
            <IconButton onClick={handleClose} size='medium' sx={{}}>
              <Close />
            </IconButton>
          </Box>

          <Typography
            variant='h6'
            sx={{ textAlign: 'center', textTransform: 'uppercase' }}
          >
            {blog.title}
          </Typography>

          {blog.content.map((p, index) => {
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: ' center',
                }}
              >
                {p.type === 'p' ? (
                  <Typography
                    sx={{
                      mt: '1rem',
                      fontSize: '.9rem',
                      lineHeight: '1.75',
                      p: '0 1rem',
                      textIndent: '2rem',
                    }}
                  >
                    {p.data}
                  </Typography>
                ) : null}

                {p.type === 'img' ? (
                  <Image
                    src={p.data}
                    width={400}
                    height={400}
                    alt='article image'
                    style={{
                      width: '90%',
                      height: 'auto',
                      boxShadow: '0px 1px 12px rgba(0, 0, 0, .30)',
                      borderRadius: '6px',
                      marginTop: '1.25rem',
                    }}
                  />
                ) : null}
                {p.type === 'pdf' ? (
                  <Button
                    color='secondary'
                    variant='contained'
                    href={p.data}
                    rel='noreffer'
                    target='_blank'
                    sx={{ fontWeight: '400', mt: '1.5rem' }}
                  >
                    {p.title}
                  </Button>
                ) : null}
              </Box>
            );
          })}
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '.75rem',
              mt: '2rem',
            }}
          >
            <Typography sx={{ fontSize: '.9rem', pl: '1rem' }}>
              {blog.date}
            </Typography>
            <Typography sx={{ fontSize: '.9rem', pr: '1rem' }}>
              - {blog.author}
            </Typography>
          </Box>
        </Box>
      </Modal>
    </Card>
  );
}
