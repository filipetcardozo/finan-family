import type { AppProps } from 'next/app'
import React from 'react'
import localFont from '@next/font/local';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from '../hooks/useAuth';
import { MonthSelectedProvider } from '../contexts/monthSelected';
import { ColorModeProvider } from '../contexts/colorMode';
import { ExpensesProvider } from '../contexts/expenses';
import { RevenuesProvider } from '../contexts/revenues';
import { MobileProvider } from '../contexts/isMobileContext';
import { CategoriesProvider } from '../contexts/categories';
import { OfflineSyncProvider } from '../contexts/offlineSync';

const manrope = localFont({
  src: '../assets/fonts/manrope-latin-variable.woff2',
  weight: '200 800',
  style: 'normal',
  display: 'swap',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
});

function MyApp({ Component, pageProps }: AppProps) {
  return <AuthProvider>
    <ColorModeProvider fontFamily={manrope.style.fontFamily}>
      <MobileProvider>
        <SnackbarProvider maxSnack={3}>
          <OfflineSyncProvider>
            <MonthSelectedProvider>
              <CategoriesProvider>
                <RevenuesProvider>
                  <ExpensesProvider>
                    <Component {...pageProps} />
                  </ExpensesProvider>
                </RevenuesProvider>
              </CategoriesProvider>
            </MonthSelectedProvider>
          </OfflineSyncProvider>
        </SnackbarProvider>
      </MobileProvider>
    </ColorModeProvider>
  </AuthProvider>
}

export default MyApp;
