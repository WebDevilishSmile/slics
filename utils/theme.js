import { lightBlue } from '@mui/material/colors';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// The raw colors both schemes are built from — the one place to change a color.
// Components never see these names; they use the palette keys below
// (background.opposite, text.light, …), which stay the same in both schemes and
// just point at a different token in each.
const tokens = {
  brand: lightBlue, // primary shades + the light scheme's paper
  chalk: '#f7f7f7', // light text
  canvas: '#edf3fc', // light page background; the dark scheme's "opposite"
  void: '#050505', // dark page background; the light scheme's "opposite"
  comment: '#eaf8fe', // comment surface in the light scheme
};

// Identical in both schemes. `secondary` is deliberately left at MUI's default
// (purple) in both schemes too: its only consumer is the Tuesday chip in
// DAY_COLORS, which has to stay distinguishable from warning (Sun/Sat) and
// success (Wed) — the two colors it used to collide with.
const primary = {
  light: tokens.brand[300],
  main: tokens.brand[600],
  dark: tokens.brand[800],
};

let theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  // Default corner radius for Paper, Card, TextField, Dialog, Alert, … (MUI's
  // own default is 4). Buttons are pill-shaped separately, under `components`.
  shape: {
    borderRadius: 8,
  },
  // App-level layout tokens. Not MUI keys — read them as `theme.layout.*`
  // (import the theme directly; that works in server components too because
  // this module has no 'use client' directive). MUI also emits each one as
  // `--mui-layout-<key>` for plain CSS.
  layout: {
    maxWidth: '32rem', // the single content column every page is built on
    minHeight: '24rem', // keeps the home/comments panels from collapsing
    elevation: 6, // Paper elevation for those panels
  },
  colorSchemes: {
    dark: {
      palette: {
        primary,
        background: {
          default: tokens.void,
          opposite: tokens.canvas,
          paper: tokens.void,
          comment: tokens.void,
        },
        text: {
          opposite: tokens.void,
          light: tokens.canvas,
        },
      },
    },
  },
  palette: {
    primary,
    background: {
      default: tokens.canvas,
      opposite: tokens.void,
      paper: tokens.brand[50],
      comment: tokens.comment,
    },
    text: {
      light: tokens.chalk,
      opposite: tokens.canvas,
    },
  },

  typography: {
    fontFamily: 'var(--font-font)',
    h1: {
      fontSize: '5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '4.2rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '3.2rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '2.8rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '2.2rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1.8rem',
      fontWeight: 500,
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1200,
      xl: 1536,
    },
  },

  components: {
    // Keep this to a single MuiButton key. Two keys in the same object collide
    // silently — the later one replaces the earlier rather than merging with it.
    //
    // No color or hover rules here on purpose. MUI's `contained` variant already
    // resolves to primary.main with contrast text and darkens to primary.dark on
    // hover, so a blanket override buys nothing and breaks two cases: it would
    // turn `color="error"` buttons blue on hover, and paint `text`/`outlined`
    // buttons near-white on a light background. Components that need a specific
    // button color set it at the call site (see footer/Footer.jsx, header/UserMenu.jsx).
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          textTransform: 'none',
        },
      },
    },

    MuiButtonGroup: {
      styleOverrides: {
        root: {
          borderRadius: 18,
        },
      },
    },

    // Component defaults (THEME.md tier 2). An explicit prop at a call site
    // still wins, so pin the exception rather than repeating the rule.
    MuiChip: {
      defaultProps: {
        size: 'small', // every chip but the home-page comment count
      },
    },
    MuiCard: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiSnackbar: {
      defaultProps: {
        autoHideDuration: 6000, // pass null for a toast that must stay up
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
