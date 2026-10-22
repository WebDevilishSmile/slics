'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { EventOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { apiRequest } from '@/lib/apiRequest';
import { addDays, formatBidDay } from '@/lib/bidDay';
import { tapHaptic } from '@/lib/haptics';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

const BID_DAYS_URL = '/api/cover-bid-days';

const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

// The selected week's bid day on /admin/cover/jobs (lib/bidDay.js,
// docs/COVER-BIDDING.md "Bid day"): the Thursday 9 days before the week ends,
// unless an admin moved it, for a holiday. Drivers see it beside their
// call-in time, and their call-in reminders go out on it. Key it by week.
export default function BidDayControl({ weekEndDate }) {
  const weekEnding = weekEndDate.format('YYYY-MM-DD');
  const [bidDay, setBidDay] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiRequest(`${BID_DAYS_URL}?week=${weekEnding}`, { method: 'GET' }).then(({ data, error: readError }) => {
      if (cancelled) return;
      if (readError) setLoadError(readError);
      else setBidDay(data.data);
    });
    return () => {
      cancelled = true;
    };
  }, [weekEnding]);

  const openDialog = () => {
    setDraft(dayjs(bidDay.bidDate));
    setError('');
    setOpen(true);
  };

  const save = async (bidDate) => {
    setSaving(true);
    setError('');
    const { data, error: saveError } = await apiRequest(BID_DAYS_URL, {
      method: 'PUT',
      body: { weekEnding, bidDate },
    });
    setSaving(false);
    if (saveError) return setError(saveError);
    setBidDay(data.data);
    setOpen(false);
    setAnnouncement(`Bid day is ${formatBidDay(data.data.bidDate)}`);
    tapHaptic();
  };

  if (loadError) return <Alert severity='error'>{loadError}</Alert>;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1.5,
        mt: 1.5,
      }}
    >
      <EventOutlined sx={{ color: 'primary.main' }} />
      <Box sx={{ flex: 1, minWidth: '12rem' }}>
        {bidDay ? (
          <>
            <Typography>
              Bid day:{' '}
              <Box component='span' sx={{ fontWeight: 700 }}>
                {formatBidDay(bidDay.bidDate)}
              </Box>
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {bidDay.moved
                ? `Moved from ${formatBidDay(bidDay.usual)}${bidDay.setBy?.name ? ` by ${bidDay.setBy.name}` : ''}`
                : 'The usual Thursday. Drivers get their call-in reminders on it.'}
            </Typography>
          </>
        ) : (
          <Skeleton variant='text' width='14rem' height='3rem' />
        )}
      </Box>
      <Button
        onClick={openDialog}
        disabled={!bidDay}
        sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
      >
        Change
      </Button>
      <Box component='span' role='status' aria-live='polite' sx={visuallyHidden}>
        {announcement}
      </Box>

      <Dialog
        open={open}
        onClose={saving ? undefined : () => setOpen(false)}
        aria-labelledby='bid-day-title'
        fullWidth
        maxWidth='xs'
      >
        <DialogTitle id='bid-day-title'>Bid day for W/E {weekEndDate.format('M/D/YYYY')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <DialogContentText>
            Drivers call in at their times on this day, and get their reminders before them.
            Move it when the usual Thursday ({bidDay && formatBidDay(bidDay.usual)}) is a holiday.
          </DialogContentText>
          <DatePicker
            label='Bid day'
            value={draft}
            onChange={setDraft}
            minDate={dayjs(addDays(weekEnding, -35))}
            maxDate={dayjs(addDays(weekEnding, -7))}
            disabled={saving}
            slotProps={{ textField: { fullWidth: true, sx: softInputSx } }}
          />
          {bidDay?.moved && (
            <Button
              onClick={() => save(null)}
              disabled={saving}
              sx={[softRaisedSmall, softPressSx, { alignSelf: 'flex-start', px: 2.5, minHeight: '3rem' }]}
            >
              Use {formatBidDay(bidDay.usual)}
            </Button>
          )}
          {error && <Alert severity='error'>{error}</Alert>}
        </DialogContent>
        <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={() => setOpen(false)}
            disabled={saving}
            sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={() => save(draft?.isValid() ? draft.format('YYYY-MM-DD') : '')}
            disabled={saving || !draft}
            sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
