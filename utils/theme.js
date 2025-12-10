'use client';
import { blue, green, grey, lightBlue, orange } from '@mui/material/colors';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    dark: {
      palette: {
        primary: {
          light: lightBlue[300],
          main: lightBlue[600],
          dark: lightBlue[800],
        },
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
    primary: {
      light: lightBlue[300],
      main: lightBlue[600],
      dark: lightBlue[800],
    },
    secondary: orange,
    containedButton: {
      main: blue[300],
      contrastText: '#222222',
    },
    background: {
      default: '#edf3fc',
      opposite: '#050505',
      paper: lightBlue[50],
      solid: '#edf3fc',
      grey: grey[300],
      comment: '#eaf8fe',
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
    MuiButton: {
      variants: [
        {
          props: { variant: 'contained' },
          style: {
            fontFamily: 'var(--font-font)',
            borderRadius: '1.5rem',
            textTransform: 'none',
            color: 'text.light',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          },
        },
        {
          props: { variant: 'text' },
          style: {
            fontFamily: 'var(--font-font)',
            borderRadius: '1.5rem',
            textTransform: 'none',
            color: 'text.light',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          },
        },
        {
          props: { variant: 'outlined' },
          style: {
            fontFamily: 'var(--font-font)',
            borderRadius: '1.5rem',
            textTransform: 'none',
            color: 'text.light',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          },
        },
      ],
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
