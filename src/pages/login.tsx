import Head from 'next/head'
import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { SignInType, useAuth } from '../hooks/useAuth';
import { Box, TextField, Container, Grid } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingButton } from '@mui/lab';
import { BrandLogo } from '../components/BrandLogo';

export default function Login() {
  const router = useRouter()
  const { signIn, isLogged, loading } = useAuth()

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    onSubmit: (credentials: SignInType) => signIn(credentials)
  });

  useEffect(() => {
    if (isLogged === true) {
      router.push('/')
    }
  }, [isLogged])

  return <>
    <Head>
      <title>Login</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <Container maxWidth='xs'>
      <Box sx={{ mt: 6, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <BrandLogo showName size={48} />
      </Box>
      <form onSubmit={formik.handleSubmit}>
        <Grid container gap={3}>
          <Grid item xs={12}>
            <TextField id="email" label="Email" variant="outlined" size='small'
              fullWidth
              name='email' type='email' onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField id="password" label="Senha" variant="outlined" size='small'
              fullWidth
              name='password' type='password' onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12} textAlign='center'>
            <LoadingButton type='submit' variant='outlined' loading={loading}>Entrar</LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Container>
  </>
}
