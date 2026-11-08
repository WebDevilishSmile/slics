'use client';

import { useState } from 'react';
import { CheckCircleOutline, OutlinedFlag } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

import SoftNotice from '@/components/utility/SoftNotice';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';
import CoverReportDialog from './CoverReport';

// The note above the jobs on /covers (docs/COVER-BIDDING.md "Reference only
// and cover reports"), shown on every visit with no dismiss: Covers is a
// reference, and calling dispatch at your call-in time is the driver's job.
// "Report a problem" files a cover report for the week on screen. Sending
// confirms in place, announced politely, until the week changes (CoverBoard
// keys this by week).
export default function CoversDisclaimer({ weekEnding, preview = false }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <>
      <SoftNotice
        sx={{ maxWidth: 'none', mb: 3 }}
        actions={
          <Box role='status' aria-live='polite' sx={{ display: 'flex', alignItems: 'center' }}>
            {sent ? (
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '2.75rem', pl: 1 }}
              >
                <CheckCircleOutline fontSize='small' color='primary' className='pop' />
                Thanks. An admin will check it.
              </Typography>
            ) : (
              <Button
                startIcon={<OutlinedFlag />}
                onClick={() => setOpen(true)}
                sx={[softRaisedSmall, softPressSx, { px: 2, minHeight: '2.75rem' }]}
              >
                Report a problem
              </Button>
            )}
          </Box>
        }
      >
        <strong>For reference only.</strong> Covers is read from the on-call sheet and can be wrong or
        behind. Calling dispatch at your call-in time and asking what&apos;s available is up to you, and so
        is checking your own covers.
      </SoftNotice>
      {open && (
        <CoverReportDialog
          weekEnding={weekEnding}
          preview={preview}
          onClose={() => setOpen(false)}
          onSent={() => {
            setOpen(false);
            setSent(true);
          }}
        />
      )}
    </>
  );
}
