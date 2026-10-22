'use client';

import { VisibilityOutlined } from '@mui/icons-material';
import { Box, Button } from '@mui/material';

import SoftNotice from '@/components/utility/SoftNotice';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// The super admin's preview of /covers as a verified cover driver sees it
// (docs/COVER-BIDDING.md, "The super admin's preview"; app/covers/page.jsx,
// `?preview=driver`). The page shows placeholder places and call-in times,
// never a real driver's, and the list isn't saved.

export const PREVIEW_HREF = '/covers?preview=driver';

// Above the page while it's a preview, with the way out.
export function PreviewNotice() {
  return (
    <SoftNotice
      icon={<VisibilityOutlined />}
      sx={{ mt: 2, mx: 'auto' }}
      actions={
        <Button href='/covers' sx={[softPressSx, { minHeight: '2.75rem', px: 1.5 }]}>
          Exit preview
        </Button>
      }
    >
      Preview: what a verified cover driver sees. Your place and call-in time are
      placeholders, and nothing you change here is saved.
    </SoftNotice>
  );
}

// The way in, on /covers for the super admin only.
export function PreviewLink() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
      <Button
        href={PREVIEW_HREF}
        startIcon={<VisibilityOutlined />}
        sx={[softRaisedSmall, softPressSx, { minHeight: '3rem', px: 2.5 }]}
      >
        See it as a cover driver
      </Button>
    </Box>
  );
}
