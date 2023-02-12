import type { AppProps } from 'next/app'
import React from 'react'
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from '../hooks/auth/useAuth';
import { MonthSelectedProvider } from '../contexts/monthSelected';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ExpensesProvider } from '../contexts/expenses';

const theme = createTheme({
  palette: {
    primary: {
      main: '#003366',
      light: '#0066CC'
    },
    secondary: {
      main: '#cce5ff',
      light: '#004C99'
    },
    text: {
      primary: '#003366',
      secondary: '#004C99'
    }
  },
  typography: {
    fontFamily: '-apple-system',
    fontSize: 16,
    button: {
      textTransform: 'none'
    }
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return <AuthProvider>
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3}>
        <MonthSelectedProvider>
          <ExpensesProvider>
            <Component {...pageProps} />
          </ExpensesProvider>
        </MonthSelectedProvider>
      </SnackbarProvider>
    </ThemeProvider>
  </AuthProvider>
}

export default MyApp;