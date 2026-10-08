import { AppBar } from '@mui/material';

// An AppBar so the footer matches the header (primary in light, dark paper in
// dark), rendered as a <footer> in the page flow. It's flat like the header:
// AppBar's default elevation 4 drew a drop shadow and, in dark mode, a
// lighter overlay band. Its height is its content (UI-SUGGESTIONS.md #37; it
// was a fixed 34rem). Container is a min-100dvh flex column, so the auto top
// margin pins the footer to the bottom of the screen on short pages (#24).
function FooterContainer({ children }) {
  return (
    <AppBar
      component='footer'
      position='static'
      elevation={0}
      sx={{
        mt: 'auto',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 4,
        color: 'text.light',
      }}
    >
      {children}
    </AppBar>
  );
}

export default FooterContainer;
