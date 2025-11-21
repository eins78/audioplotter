import { useState, useEffect } from 'react'
import packageJson from '../package.json'
import AppLayout from './components/AppLayout.js'
import AudioPlotter from './components/AudioPlotter.js'
import './styles/style.scss'

const isDev = import.meta.env.MODE === 'development'

const { version: PKG_VERSION, repository: SOURCE_URL } = packageJson as {
  version: string
  repository: string
}

const version = isDev ? 'dev' : `v${PKG_VERSION}`

const menu = (
  <div className="btn-group btn-group-sm me-2">
    <a href={SOURCE_URL + '#readme'} target="_blank" rel="noreferrer" className="btn btn-link">
      README
    </a>
    <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="btn btn-link">
      source code
    </a>
  </div>
)

export default function App() {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])

  return <AppLayout version={version} menu={menu}>{isClient && <AudioPlotter />}</AppLayout>
}
