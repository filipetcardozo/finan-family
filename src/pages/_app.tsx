import type { AppProps } from 'next/app'
import React from 'react'
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from '../hooks/useAuth';
import { MonthSelectedProvider } from '../contexts/monthSelected';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ExpensesProvider } from '../contexts/expenses';
import { RevenuesProvider } from '../contexts/revenues';
import { MobileProvider } from '../contexts/isMobileContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0f6a72',
      light: '#15917c',
      dark: '#082b43'
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
      <MobileProvider>
        <SnackbarProvider maxSnack={3}>
          <MonthSelectedProvider>
            <RevenuesProvider>
              <ExpensesProvider>
                <Component {...pageProps} />
              </ExpensesProvider>
            </RevenuesProvider>
          </MonthSelectedProvider>
        </SnackbarProvider>
      </MobileProvider>
    </ThemeProvider>
  </AuthProvider>
}

export default MyApp;
