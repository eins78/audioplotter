import React, { useState, useEffect, useRef } from 'react'
import packageJson from '../package.json'
import AppLayout from '../components/AppLayout'
import AudioPlotter from '../components/AudioPlotter'
// const SOURCE_URL = pkg.repository
const isDev = process.env.NODE_ENV === 'development'

const { version: PKG_VERSION, repository: SOURCE_URL } = packageJson

const version = isDev ? 'dev' : `v${PKG_VERSION}`

export async function getStaticProps(context) {
  return {
    props: {
      // TODO: get from git (childprocess_exec)
      gitTreeIdShort: 'd2ba02a',
    }, // will be passed to the page component as props
  }
}

export default function Home() {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])

  return (
    <AppLayout version={version} menu={menu}>
      {isClient && <AudioPlotter />}
    </AppLayout>
  )
}

const menu = (
  <div className="btn-group btn-group-sm me-2">
    <a href={SOURCE_URL + '#readme'} target="_blank" className="btn  btn-link">
      README
    </a>
    <a href={SOURCE_URL} target="_blank" className="btn  btn-link">
      source code
    </a>
  </div>
)
