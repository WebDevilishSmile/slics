'use client';

import Link from '@/components/utility/NextLink';
import { ChevronRightOutlined } from '@mui/icons-material';
import { Box, ButtonBase, Typography } from '@mui/material';

import { softPressSx, softRaised } from '@/components/utility/soft';

// The Covers hub's tools (COVER_TOOLS in constants.js): a raised tile per
// tool that presses in, with its name, what it's for and, when there is one,
// a status line about the week being bid on (lib/db/coverHub.js). A client
// component because the soft sx helpers are functions of the theme.
export default function CoverToolTiles({ tools, lines = {} }) {
  return (
    <Box
      component='ul'
      aria-label='Cover tools'
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        width: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
        gap: { xs: 2, sm: 2.5 },
      }}
    >
      {tools.map((tool, index) => (
        <Box component='li' key={tool.href} sx={{ display: 'flex' }}>
          <ButtonBase
            component={Link}
            href={tool.href}
            className='enter'
            sx={[
              softRaised,
              softPressSx,
              {
                '--i': index,
                width: '100%',
                minHeight: '7.5rem',
                borderRadius: 4,
                p: 2.5,
                gap: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
              },
            ]}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
              <Typography component='span' variant='h6' sx={{ fontWeight: 700, color: 'primary.main' }}>
                {tool.label}
              </Typography>
              <Typography component='span' variant='body2' color='text.secondary'>
                {tool.description}
              </Typography>
              {lines[tool.key] && (
                <Typography component='span' variant='body2' sx={{ fontWeight: 600, mt: 0.5 }}>
                  {lines[tool.key]}
                </Typography>
              )}
            </Box>
            <ChevronRightOutlined sx={{ color: 'primary.main', flexShrink: 0 }} />
          </ButtonBase>
        </Box>
      ))}
    </Box>
  );
}
