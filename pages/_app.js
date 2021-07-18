import Head from 'next/head'

import '../styles/style.scss'

const SITE_TITLE = 'audioplotter'

// from favicons package
function faviconsHead() {
  return (
    <>
      <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
      <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#500cbd" />
      <meta name="apple-mobile-web-app-title" content="audiplotter" />
      <meta name="application-name" content="audiplotter" />
      <meta name="msapplication-TileColor" content="#500cbd" />
      <meta name="theme-color" content="#500cbd" />
    </>
  )
}

// from https://github.com/vercel/next.js/blob/736db423528e66d3d8f7aa1174a3b5310d2a57a9/examples/progressive-web-app/pages/_app.js
function pwaHead() {
  return (
    <>
      <link rel="manifest" href="/manifest.json" />
    </>
  )
}

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
        />
        <title>{SITE_TITLE}</title>
        {/* <meta name="description" content="Description" /> */}
        {/* <meta name="keywords" content="Keywords" /> */}
        {pwaHead()}
        {faviconsHead()}
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
