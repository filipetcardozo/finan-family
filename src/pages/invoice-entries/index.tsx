import Head from 'next/head'
import { LayoutMobile } from '../../components/app-layout'
import { useProtectPage } from '../../hooks/auth/useAuth'

export default function InvoiceEntries() {
  useProtectPage()

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <LayoutMobile tabSelected='/invoice-entries'>
        Invoice Entries Page
      </LayoutMobile>
    </>
  )
}