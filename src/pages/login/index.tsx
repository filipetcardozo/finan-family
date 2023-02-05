import Head from 'next/head'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { SignInType, useAuth, useProtectPage } from '../../hooks/auth/useAuth';
import { TextField, Button } from '@mui/material';
import { useFormik } from 'formik';

export default function Login() {
  const router = useRouter()
  const { signIn, isLogged } = useAuth()

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    onSubmit: (credentials: SignInType) => signIn(credentials)
  });

  useEffect(() => {
    console.log(isLogged)
    if (isLogged === true) {
      router.push('/')
    }
  }, [isLogged])

  return <>
    <Head>
      <title>Login</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <form onSubmit={formik.handleSubmit}>
      <TextField id="outlined-basic" label="Email" variant="outlined"
        name='email' type='email' onChange={formik.handleChange}
      />
      <TextField id="outlined-basic" label="Senha" variant="outlined"
        name='password' type='password' onChange={formik.handleChange}
      />
      <Button type='submit'>Entrar</Button>
    </form>
  </>
}