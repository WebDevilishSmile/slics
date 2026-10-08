import { Paper } from '@mui/material';

// The lookup card. It has no generic "Slic Details" title any more: the SLIC
// itself is the card's heading (home/TitleAddress.jsx, UI-SUGGESTIONS.md #40).
function SlicDetailsContainer({ children }) {
  return (
    // The name lets a SLIC switch cross-fade this card (UI-SUGGESTIONS.md #48).
    // EmptySlic and SlicCardSkeleton share it; only one renders at a time.
    <Paper
      variant='panel'
      sx={{ justifyContent: 'center', viewTransitionName: 'slic-details' }}
    >
      {children}
    </Paper>
  );
}

export default SlicDetailsContainer;
