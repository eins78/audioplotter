import React, { useState, useEffect, useRef } from 'react'
import pkg from '../package.json'
import AppLayout from '../components/AppLayout'
import AudioPlotter from '../components/AudioPlotter'
const SOURCE_URL = pkg['repository']

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

export default function Home() {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])

  return <AppLayout menu={menu}>{isClient && <AudioPlotter />}</AppLayout>
}
