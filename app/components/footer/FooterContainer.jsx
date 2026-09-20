import { AppBar, Toolbar, Typography } from '@mui/material';

function FooterContainer({ children }) {
  return (
    <AppBar
      sx={{
        position: 'static',
        bottom: 0,
        width: '100%',
        zIndex: 1000,
        height: { xs: '34rem', md: '30rem' },
        color: 'text.light',
      }}
    >
      <Toolbar
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'center',
          alignItems: 'center',
          px: 4,
          py: 2,
        }}
      >
        {children}
      </Toolbar>
    </AppBar>
  );
}

export default FooterContainer;
