import React from 'react';
import { LayoutMobile } from '../components/app-layout';
import { useAuth, useProtectPage } from '../hooks/auth/useAuth';
import Head from 'next/head'

const Custom500 = () => {
    const { isLogged } = useAuth()

    useProtectPage()

    if (isLogged != true) {
        return <>
            <Head>
                <title>Meu Repertório</title>
                <meta name="viewport" content="initial-scale=1.0, width=device-width" />
            </Head>
            Carregando...
        </>
    }

    return <>
        <Head>
            <title>Meu Repertório</title>
            <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        </Head>
        Ops... tivemos algum problema.
    </>
}

export default Custom500;