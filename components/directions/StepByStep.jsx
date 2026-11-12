'use client';

import { useEffect } from 'react';
import {
  ArrowBack,
  ArrowForward,
  FormatListNumbered,
  RecordVoiceOver,
  RecordVoiceOverOutlined,
} from '@mui/icons-material';
import { Box, Button, DialogActions, DialogContent, Typography } from '@mui/material';

import { tapHaptic } from '@/lib/haptics';
import { sectionLabel } from '@/lib/routeText';
import { softContainedSx, softPressSx, softRaisedSmall } from '@/components/utility/soft';

// One step at a time, as large as the screen allows, with Back and Next as
// big tap areas a thumb finds without looking (docs/SLIC-DIRECTIONS.md →
// "Long routes and hands-free"). The arrow keys work too. Reading aloud is
// the sheet's (it owns the voice, so closing it stops the voice).
export default function StepByStep({
  section,
  index,
  onIndex,
  onExit,
  canRead,
  reading,
  onToggleReading,
}) {
  const total = section.steps.length;
  const last = index === total - 1;

  const next = () => {
    tapHaptic();
    if (last) onExit();
    else onIndex(index + 1);
  };
  const back = () => {
    if (index > 0) onIndex(index - 1);
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 2.5,
          minHeight: { xs: '55vh', sm: '18rem' },
        }}
      >
        <Typography variant='body2' color='text.secondary'>
          {sectionLabel(section)} · Step {index + 1} of {total}
        </Typography>
        {/* The live region stays put while the step inside it changes, so
            a screen reader announces each new step. */}
        <Box aria-live='polite'>
          <Typography
            key={`${section.title}-${index}`}
            className='enter'
            variant='h4'
            component='p'
            sx={{ lineHeight: 1.35 }}
          >
            {section.steps[index]}
          </Typography>
        </Box>
        <Typography variant='caption' color='text.secondary'>
          Screen stays on · Don&apos;t use your phone while driving
        </Typography>
      </DialogContent>

      <DialogActions
        disableSpacing
        sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1.5, px: 3, pb: 3 }}
      >
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            onClick={back}
            disabled={index === 0}
            startIcon={<ArrowBack />}
            sx={[softRaisedSmall, softPressSx, { flex: 1, minHeight: '4.5rem' }]}
          >
            Back
          </Button>
          <Button
            variant='contained'
            onClick={next}
            endIcon={last ? null : <ArrowForward />}
            sx={[softContainedSx, { flex: 2, minHeight: '4.5rem', typography: 'h6' }]}
          >
            {last ? 'Done' : 'Next'}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {canRead && (
            <Button
              onClick={onToggleReading}
              aria-pressed={reading}
              startIcon={reading ? <RecordVoiceOver /> : <RecordVoiceOverOutlined />}
              sx={[softRaisedSmall, softPressSx, { flex: 1, minHeight: '3rem' }]}
            >
              {reading ? 'Reading aloud' : 'Read aloud'}
            </Button>
          )}
          <Button
            onClick={onExit}
            startIcon={<FormatListNumbered />}
            sx={[softRaisedSmall, softPressSx, { flex: 1, minHeight: '3rem' }]}
          >
            All steps
          </Button>
        </Box>
      </DialogActions>
    </>
  );
}
