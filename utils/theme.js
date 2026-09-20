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
  // `--mui-layout-<key>` (nested: `--mui-layout-width-panel`) for plain CSS.
  layout: {
    // The width scale (THEME.md #19). Every page-level `maxWidth` is one of
    // these five steps — pick by role, don't add a sixth for a one-off. They
    // only bite above phone width; on phones everything is `width: 100%`.
    width: {
      field: '30rem', // a single form control column (slic form fields, sign-in)
      panel: '32rem', // the content column every page is built on (panels, comments)
      prose: '40rem', // readable text: about page, page intros, comment threads
      wide: '55rem', // full-width messaging and admin tables/forms
      page: '1436px', // PageContainer's outer bound
    },
    minHeight: '24rem', // keeps the home/comments panels from collapsing
    elevation: 6, // Paper elevation for those panels (read by the `panel` variant below)
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

    // `<Paper variant="panel">` — the content panel the home and comments
    // pages are built on (THEME.md #17). Only the structural block lives here;
    // content alignment (`justifyContent`) and tighter side padding are set by
    // the call sites that need them. Paper applies its shadow and elevation
    // overlay only for variant="elevation" (see Paper.js), so a custom variant
    // has to set both itself. `theme.vars.overlays[n]` is the same
    // `var(--mui-overlays-n, <fallback>)` MUI's own elevation path uses, so
    // this renders identically to `elevation={6}` in both color schemes.
    MuiPaper: {
      variants: [
        {
          props: { variant: 'panel' },
          style: ({ theme }) => ({
            width: '100%',
            maxWidth: theme.layout.width.panel,
            minHeight: theme.layout.minHeight,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: theme.spacing(4),
            padding: theme.spacing(4),
            boxShadow: (theme.vars || theme).shadows[theme.layout.elevation],
            backgroundImage: theme.vars.overlays[theme.layout.elevation],
          }),
        },
      ],
    },

    // `<Typography variant="sectionHeading">` — every page/section title
    // (THEME.md #18; replaced the StyledHeading wrapper). It is h2 plus the
    // house treatment. Spreading `theme.typography.h2` inside the callback,
    // rather than copying its metrics, keeps it in lockstep with h2 —
    // including the breakpoint font sizes responsiveFontSizes() adds, since
    // the callback sees the final theme. `variantMapping` keeps the <h2> tag.
    MuiTypography: {
      defaultProps: {
        variantMapping: { sectionHeading: 'h2' },
      },
      variants: [
        {
          props: { variant: 'sectionHeading' },
          style: ({ theme }) => ({
            ...theme.typography.h2,
            fontWeight: 800,
            textTransform: 'uppercase',
            textAlign: 'center',
            maxWidth: theme.layout.width.panel,
            paddingLeft: theme.spacing(1),
            paddingRight: theme.spacing(1),
          }),
        },
      ],
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
