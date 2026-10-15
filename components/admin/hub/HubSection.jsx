'use client';

import Link from '@/components/utility/NextLink';
import { ChevronRightOutlined } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// One section of a super admin page (docs/SUPER-ADMIN-HUB.md): a heading, an
// optional "See all"-style link on its right, and its content. Open on the
// page, not a card: the content brings its own soft shapes.
export default function HubSection({ id, title, description, action, children }) {
  return (
    <Box component='section' aria-labelledby={id} sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap',
          mb: description ? 0.5 : 1.5,
        }}
      >
        <Typography id={id} variant='h6' component='h3' sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {action && (
          <Button
            component={Link}
            href={action.href}
            endIcon={<ChevronRightOutlined />}
            sx={[softRaisedSmall, softPressSx, { px: 2, minHeight: '2.75rem' }]}
          >
            {action.label}
          </Button>
        )}
      </Box>
      {description && (
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
          {description}
        </Typography>
      )}
      {children}
    </Box>
  );
}
