'use client';

import { createTheme, Theme } from '@mui/material/styles';

// Custom shadows matching Materio design system
const customShadows = {
  xs: '0px 2px 4px 0px rgba(76, 78, 100, 0.2)',
  sm: '0px 2px 6px 0px rgba(76, 78, 100, 0.22)',
  md: '0px 2px 10px 0px rgba(76, 78, 100, 0.22)',
  lg: '0px 4px 14px 0px rgba(76, 78, 100, 0.25)',
  xl: '0px 8px 28px 0px rgba(76, 78, 100, 0.28)',
};

export const theme = createTheme({
  palette: {
    mode: 'light', // LIGHT MODE - Clean, bright, professional
    primary: {
      main: '#9155FD', // Materio purple - VIBRANT (100% saturation)
      light: '#A678FF',
      dark: '#7E3AF2',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#8A8D93',
      light: '#9E9FA4',
      dark: '#777B82',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#56CA00', // VIBRANT lime green (100% saturation)
      light: '#6FDD1A',
      dark: '#4CAF50',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFB400', // VIBRANT golden orange (100% saturation)
      light: '#FFC426',
      dark: '#FF9800',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FF4C51', // VIBRANT coral red (100% saturation)
      light: '#FF6B6F',
      dark: '#F44336',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#16B1FF', // VIBRANT cyan blue (100% saturation)
      light: '#3FC3FF',
      dark: '#00ACC1',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F4F5FA', // Light grayish-blue background (Materio light)
      paper: '#FFFFFF', // Pure white cards
    },
    text: {
      primary: 'rgba(76, 78, 100, 0.87)', // Dark text (87% opacity)
      secondary: 'rgba(76, 78, 100, 0.68)', // Secondary dark text
      disabled: 'rgba(76, 78, 100, 0.38)', // Disabled text
    },
    divider: 'rgba(76, 78, 100, 0.12)', // Light dividers
    action: {
      active: 'rgba(76, 78, 100, 0.54)',
      hover: 'rgba(76, 78, 100, 0.04)', // Subtle hover on light bg
      selected: 'rgba(76, 78, 100, 0.08)',
      disabled: 'rgba(76, 78, 100, 0.26)',
      disabledBackground: 'rgba(76, 78, 100, 0.12)',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '1.75rem',  // 28px
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.5rem',   // 24px
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.25rem',  // 20px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1rem',     // 16px
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '0.9375rem', // 15px
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.9375rem', // 15px
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',  // 14px
      lineHeight: 1.43,
    },
    caption: {
      fontSize: '0.76171875rem', // ~12.2px
      lineHeight: 1.66,
    },
  },
  shape: {
    borderRadius: 6,
  },
  spacing: 8,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: customShadows.md,
          transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: customShadows.lg,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 6,
          padding: '0.5rem 0.875rem',
          fontSize: '0.9375rem',
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: customShadows.sm,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(98deg, #9155FD 0%, #A678FF 100%)',
          '&:hover': {
            background: 'linear-gradient(98deg, #7E3AF2 0%, #9155FD 100%)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          height: 24,
          fontSize: '0.8125rem',
        },
        outlined: {
          borderWidth: 1.5,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(76, 78, 100, 0.04)', // Very subtle gray in light mode
          '& .MuiTableCell-root': {
            fontWeight: 600,
            fontSize: '0.8125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'rgba(76, 78, 100, 0.87)', // Dark text in light mode
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '1rem',
          fontSize: '0.9375rem',
          borderBottom: '1px solid rgba(76, 78, 100, 0.12)', // Light mode divider
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(76, 78, 100, 0.04)', // Light mode hover
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF', // White AppBar in light mode
          color: 'rgba(76, 78, 100, 0.87)', // Dark text in light mode
          boxShadow: customShadows.sm,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '4px 16px',
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(76, 78, 100, 0.04)', // Light mode hover
          },
          '&.Mui-selected': {
            background: 'linear-gradient(72.47deg, #9155FD 22.16%, #A678FF 76.47%)',
            color: '#FFFFFF',
            boxShadow: customShadows.xs,
            '&:hover': {
              background: 'linear-gradient(72.47deg, #7E3AF2 22.16%, #9155FD 76.47%)',
            },
            '& .MuiListItemIcon-root': {
              color: '#FFFFFF',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF', // White sidebar in light mode
          borderRight: '1px solid rgba(76, 78, 100, 0.12)', // Light mode divider
        },
      },
    },
  },
});

// Add custom shadows to theme
declare module '@mui/material/styles' {
  interface Theme {
    customShadows: typeof customShadows;
  }
  interface ThemeOptions {
    customShadows?: typeof customShadows;
  }
}

// Augment the theme with custom shadows
(theme as Theme & { customShadows: typeof customShadows }).customShadows = customShadows;
