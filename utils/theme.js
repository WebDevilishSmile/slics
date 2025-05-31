'use client';
import {
  blue,
  blueGrey,
  brown,
  cyan,
  deepOrange,
  green,
  grey,
  lightBlue,
  lime,
  orange,
  purple,
  red,
} from '@mui/material/colors';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    dark: {
      palette: {
        primary: lightBlue,
        secondary: green,
        background: {
          default: '#050505',
          opposite: '#edf3fc',
          paper: '#050505',
          solid: '#edf3fc',
          grey: grey[800],
          comment: '#050505',
        },
        text: {
          dark: '#222222',
          solid: '#222222',
          opposite: '#050505',
          light: '#edf3fc',
        },
      },
    },
  },
  palette: {
    primary: orange,
    secondary: green,
    containedButton: {
      main: blue[300],
      contrastText: '#222222',
    },
    background: {
      default: '#edf3fc',
      opposite: '#050505',
      paper: blueGrey[50],
      solid: '#edf3fc',
      grey: grey[300],
      comment: grey[50],
    },
    text: {
      dark: '#222222',
      light: '#f7f7f7',
      opposite: '#edf3fc',
      solid: '#222222',
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
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-font)',
          borderRadius: '1.5rem',
          textTransform: 'none',
        },
      },
    },

    MuiButtonGroup: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-font)',
          borderRadius: '1.5rem',
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
