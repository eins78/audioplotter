import React, { useState } from 'react'

import AudioSVGWaveform from '../lib/waveform'
import { Svg, Polyline } from 'react-svg-path'
import AppLayout from '../components/AppLayout'

const isBrowser = () => typeof window !== 'undefined'

const NUM_PEAKS = 600

function pathfromAudio(url, callback) {
  const trackWaveform = new AudioSVGWaveform({ url: url, peaks: NUM_PEAKS })

  trackWaveform.loadFromUrl().then(() => {
    const data = trackWaveform.getData()
    callback(data)
  })
}

const SVG = ({ path, color = '#222' }) => (
  <Svg height="100%" width="100%" viewBox="0 0 200 81">
    <g transform={`matrix(0.0334504,0,0,81,0,40.5)`}>
      <path d={path} fill="none" stroke={color} height="100%" width="100%" x="0" y="0" />
    </g>
  </Svg>
)

const SvgFromAudioPeaks = ({ peaks }) => {
  const height = 100
  const points = peaks.map((peak, index) => {
    const xPos = index * 1
    const yPos = height / 2 + peak * height
    console.log([index, peak, xPos, yPos])
    return [xPos, yPos]
  })
  return (
    <Svg width={peaks.length / 2} height={height} scale>
      <Polyline points={points} stroke="#222" strokeWidth={1} fill="#ffffff" />
    </Svg>
  )
}

const AudioWaveForm = () => {
  const url = 'http://localhost:5000/The_Amen_Break.wav'
  const [data, setData] = useState({})
  const { peaks, path } = data
  pathfromAudio(url, (data) => setData(data))
  return (
    <div style={{ textAlign: 'center' }}>
      {/* <button onClick={() => pathfromAudio(url, (data) => setData(data))}>audio</button> */}
      {/* <pre>{`${path}`}</pre> */}
      <div className="ratio ratio-16x9">{!!path && <SVG path={path} />}</div>
      {/* <div className="ratio ratio-16x9">{!!peaks && <pre>{JSON.stringify(peaks)}</pre>}</div> */}
      <div className="ratio ratio-16x9">{!!peaks && <SvgFromAudioPeaks peaks={peaks} />}</div>
    </div>
  )
}

export default function Home() {
  return <AppLayout>{isBrowser() && <AudioWaveForm />}</AppLayout>
}
