'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { CheckCircleOutline, HourglassTopOutlined, VerifiedOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Paper, Typography } from '@mui/material';

import SoftNotice from '@/components/utility/SoftNotice';
import { softContainedSx, softPressSx, softRaisedSmall } from '@/components/utility/soft';
import DriverClaimDialog from './DriverClaimDialog';

const actionSx = [softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem', ml: 1 }];

// /covers for a driver who isn't verified yet (docs/COVER-BIDDING.md): why
// the list is hidden, and the claim that unlocks it, in whichever state it's
// in. `initialClaim` is their latest claim (getMyDriverClaim) or null. An
// approved claim here means the verification was taken away since, so it
// reads like no claim at all.
export default function DriverVerification({ initialClaim }) {
  const [claim, setClaim] = useState(initialClaim);
  const [open, setOpen] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const pending = claim?.status === 'pending';
  const rejected = claim?.status === 'rejected';

  return (
    <Paper variant='panel' className='enter' sx={{ minHeight: 0, gap: 2.5 }}>
      {pending ? (
        <SoftNotice
          icon={<HourglassTopOutlined />}
          actions={
            <Button onClick={() => setOpen(true)} sx={actionSx}>
              Edit claim
            </Button>
          }
        >
          <strong>Your claim is with an admin.</strong> Sent{' '}
          {dayjs(claim.updated_at ?? claim.created_at).format('MMM D, YYYY')} as{' '}
          {claim.name}. The cover list shows here once you&apos;re verified.
        </SoftNotice>
      ) : (
        <>
          {rejected && (
            <Alert severity='warning' sx={{ width: '100%' }}>
              An admin couldn&apos;t verify your last claim
              {claim.note ? (
                // Plain text, never HTML.
                <Box component='span' sx={{ display: 'block', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {claim.note}
                </Box>
              ) : (
                '.'
              )}
            </Alert>
          )}
          <SoftNotice
            icon={<VerifiedOutlined />}
            actions={
              <Button
                variant='contained'
                onClick={() => setOpen(true)}
                sx={[softContainedSx, { px: 3, minHeight: '3rem', ml: 1 }]}
              >
                {rejected ? 'Try again' : "Verify I'm a driver"}
              </Button>
            }
          >
            <strong>Only verified drivers can see the cover list.</strong> Verify
            once with your name, your UPS email and your seniority date, and an
            admin checks them against the on-call sheet.
          </SoftNotice>
          <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center' }}>
            Not doing covers? Nothing else in SLICs needs this.
          </Typography>
        </>
      )}

      <Box role='status' aria-live='polite'>
        {justSent && (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <CheckCircleOutline fontSize='small' color='primary' className='pop' />
            Sent. An admin will check it.
          </Typography>
        )}
      </Box>

      {open && (
        <DriverClaimDialog
          claim={pending ? claim : null}
          onClose={() => setOpen(false)}
          onSent={(saved) => {
            setOpen(false);
            setClaim(saved);
            setJustSent(true);
          }}
        />
      )}
    </Paper>
  );
}
