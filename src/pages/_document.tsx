import Document, { Html, Head, Main, NextScript } from 'next/document';
import { colorModeCss, colorModeInitScript } from '../theme/palette';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="pt-BR" suppressHydrationWarning>
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#15803d" />
          <style dangerouslySetInnerHTML={{ __html: colorModeCss }} />
          <script dangerouslySetInnerHTML={{ __html: colorModeInitScript }} />
          <link rel="icon" type="image/png" sizes="16x16" href="/brand/favicon-16.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png" />
          <link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg" />
          <link rel="shortcut icon" href="/favicon.ico?v=abrigo" />
          <link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
