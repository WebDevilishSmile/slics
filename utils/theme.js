import { lightBlue } from '@mui/material/colors';
import {
  createTheme,
  darken,
  getOverlayAlpha,
  lighten,
  responsiveFontSizes,
  rgbToHex,
} from '@mui/material/styles';

// The raw colors both schemes are built from — the one place to change a color.
// Components never see these names; they use the palette keys below
// (background.comment, text.light, …), which stay the same in both schemes and
// just point at a different token in each.
const tokens = {
  brand: lightBlue, // primary shades + the light scheme's paper
  // The light scheme's primary.main (UI-SUGGESTIONS.md #31): lightBlue[800]
  // darkened 4%. Stock [800] takes white labels (4.79:1) but misses 4.5 by a
  // hair for chalk text on it and for it as text on the canvas, paper and
  // comment surfaces (4.27–4.47). 4% is the least darkening that clears them.
  ink: '#0172b5',
  chalk: '#f7f7f7', // light text; the Buy Me a Coffee tile
  canvas: '#edf3fc', // light page background; dark-scheme header/footer text
  void: '#050505', // dark page background; text on the Buy Me a Coffee tile
  comment: '#eaf8fe', // comment surface in the light scheme
};

// One brand blue can't serve both schemes (UI-SUGGESTIONS.md #31): white text
// needs a dark blue, and blue text on the black canvas needs a bright one. So
// the light scheme gets the darker `ink` with white labels, and the dark scheme
// keeps the bright [600] with dark labels (white on it is only 3.08:1).
// `secondary` is deliberately left at MUI's default (purple) in both schemes:
// its only consumer is the Tuesday chip in DAY_COLORS, which has to stay
// distinguishable from warning (Sun/Sat) and success (Wed) — the two colors it
// used to collide with.
const primary = {
  light: tokens.brand[300],
  main: tokens.ink,
  dark: tokens.brand[900],
};
const darkPrimary = {
  light: tokens.brand[300],
  main: tokens.brand[600],
  dark: tokens.brand[800], // white on it is 4.79:1 (the menu's header band)
  contrastText: 'rgba(0, 0, 0, 0.87)',
};

// Buy Me a Coffee's button: their logo is dark on a light tile, so it stays
// light in both schemes. Read as `color='bmc'` (layout/BmcButton.jsx);
// light/dark exist for MUI's hover and active states.
const bmc = {
  main: tokens.chalk,
  light: lighten(tokens.chalk, 0.5),
  dark: darken(tokens.chalk, 0.1),
  contrastText: tokens.void,
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
  // App layers on top of MUI's own scale (mobileStepper 1000 … tooltip 1500),
  // which createTheme keeps. Use them by name in sx: `zIndex: 'stickyBar'`.
  zIndex: {
    // A sticky filter bar over its own scrolling table (bids, cover bid jobs);
    // below every MUI layer so menus, dialogs and the app bar still cover it.
    stickyBar: 10,
  },
  // App-level layout tokens. Not MUI keys — read them as `theme.layout.*`
  // (import the theme directly; that works in server components too because
  // this module has no 'use client' directive). MUI also emits each one as
  // `--mui-layout-<key>` (nested: `--mui-layout-width-panel`) for plain CSS.
  layout: {
    // The width scale (UI-SUGGESTIONS.md #19). Every page-level `maxWidth` is one of
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
        primary: darkPrimary,
        bmc,
        background: {
          default: tokens.void,
          paper: tokens.void,
          comment: tokens.void,
        },
        text: {
          light: tokens.canvas,
        },
      },
    },
  },
  palette: {
    primary,
    bmc,
    background: {
      default: tokens.canvas,
      paper: tokens.brand[50],
      comment: tokens.comment,
    },
    text: {
      light: tokens.chalk,
    },
  },

  // Desktop sizes. responsiveFontSizes() below shrinks each to
  // 1 + (size − 1) / 2 rem on phones: h1 36px, h2 28px (UI-SUGGESTIONS.md #38).
  typography: {
    fontFamily: 'var(--font-font)',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.6rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.35rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1.15rem',
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

    // Component defaults (UI-SUGGESTIONS.md tier 2). An explicit prop at a call site
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
    // pages are built on (UI-SUGGESTIONS.md #17). Only the structural block lives here;
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
    // (UI-SUGGESTIONS.md #18; replaced the StyledHeading wrapper). It is h2,
    // centered and capped at prose width. It used to be uppercase at weight
    // 800 too, which read as shouting and wrapped titles on phones (#38), so
    // titles now show their source casing. Spreading `theme.typography.h2` inside
    // the callback, rather than copying its metrics, keeps it in lockstep with
    // h2, including the breakpoint font sizes responsiveFontSizes() adds, since
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
            textAlign: 'center',
            maxWidth: theme.layout.width.prose,
            paddingLeft: theme.spacing(1),
            paddingRight: theme.spacing(1),
          }),
        },
      ],
    },
  },
});

theme = responsiveFontSizes(theme);

// The browser/status bar color in each scheme, matching the header
// (UI-SUGGESTIONS.md #35). Light: the header is primary.main. Dark: MUI doesn't
// color an AppBar in dark mode (enableColorOnDark is false), so it draws as the
// dark paper under Paper's white elevation overlay. AppBar's default elevation
// is 4, and lighten() is the same blend as that overlay. Read by app/layout.jsx,
// app/manifest.js and layout/ThemeColorSync.jsx.
export const statusBarColors = {
  light: primary.main,
  dark: rgbToHex(lighten(tokens.void, getOverlayAlpha(4))),
};

export default theme;
