import { Paper } from '@mui/material';

// The lookup card. It has no generic "Slic Details" title any more: the SLIC
// itself is the card's heading (home/TitleAddress.jsx, UI-SUGGESTIONS.md #40).
function SlicDetailsContainer({ children }) {
  return (
    <Paper variant='panel' sx={{ justifyContent: 'center' }}>
      {children}
    </Paper>
  );
}

export default SlicDetailsContainer;
