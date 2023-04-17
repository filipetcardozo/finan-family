import React from 'react';
import { LayoutMobile } from '../components/AppLayoutMobile';
import { useAuth, useProtectPage } from '../hooks/useAuth';
import Head from 'next/head'

const Custom404 = () => {
    const { isLogged } = useAuth()

    useProtectPage()

    if (isLogged != true) {
        return <>
            <Head>
                <title>Meu Repertório</title>
                <meta name="viewport" content="initial-scale=1.0, width=device-width" />
            </Head>
            Carregando...
        </ >
    }

    return <>
        <Head>
            <title>Meu Repertório</title>
            <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        </Head>
        <LayoutMobile tabSelected={undefined}>
            Ops... página não encontrada.
        </LayoutMobile>
    </>
}

export default Custom404;