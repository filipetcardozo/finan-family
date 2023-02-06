import type { AppProps } from 'next/app'
import React from 'react'
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from '../hooks/auth/useAuth';

function MyApp({ Component, pageProps }: AppProps) {
  return <AuthProvider>
    <SnackbarProvider maxSnack={3}>
      <Component {...pageProps} />
    </SnackbarProvider>
  </AuthProvider>
}

export default MyApp;