'use client';

import { forwardRef } from 'react';
import { Dialog, DialogActions, Slide, useMediaQuery } from '@mui/material';

import theme from '@/theme';

const SlideUp = forwardRef(function SlideUp(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />;
});

// A MUI Dialog that becomes a bottom sheet on phones (UI-SUGGESTIONS.md #50):
// it slides up from the bottom edge and sits there full-width, so its buttons
// land where a thumb already is. From the `sm` breakpoint up it's an ordinary
// centered dialog. Takes any Dialog prop; the paper's styling is owned here.
function BottomSheetDialog({ children, ...dialogProps }) {
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <Dialog
      fullWidth
      maxWidth='xs'
      {...dialogProps}
      slots={isPhone ? { transition: SlideUp } : undefined}
      transitionDuration={reduceMotion ? 0 : undefined}
      sx={
        isPhone
          ? { '& .MuiDialog-container': { alignItems: 'flex-end' } }
          : undefined
      }
      slotProps={{
        paper: {
          sx: isPhone
            ? {
                m: 0,
                width: '100%',
                maxWidth: '100%',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                // Clear the iPhone home indicator in the installed app.
                pb: 'env(safe-area-inset-bottom)',
              }
            : undefined,
        },
      }}
    >
      {children}
    </Dialog>
  );
}

// The sheet's buttons: full-width, stacked, 48px tall with room between them,
// because they're tapped one-handed and maybe gloved. Put the likeliest
// choice first.
export function BottomSheetActions({ children }) {
  return (
    <DialogActions
      disableSpacing
      sx={{
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 1.5,
        px: 3,
        pb: 3,
        '& .MuiButton-root': { minHeight: '3rem' },
      }}
    >
      {children}
    </DialogActions>
  );
}

export default BottomSheetDialog;
