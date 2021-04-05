import React, { useState } from 'react'

import AudioSVGWaveform from '../lib/waveform'
import { Svg, Polyline } from 'react-svg-path'
import AppLayout from '../components/AppLayout'
import AudioAnalyser from '../components/AudioAnalyser'
import { urlObjectKeys } from 'next/dist/next-server/lib/utils'

const isBrowser = () => typeof window !== 'undefined'

const SvgFromAudioPeaks = ({ peaks }) => {
  const height = 100
  const points = peaks.map((peak, index) => {
    const xPos = index * 1
    const yPos = height / 2 + peak * height
    // console.log([index, peak, xPos, yPos])
    return [xPos, yPos]
  })
  return (
    <Svg width={peaks.length / 2} height={height} scale>
      <Polyline points={points} stroke="#222" strokeWidth={1} fill="#ffffff" />
    </Svg>
  )
}

const AudioWaveForm = () => {
  const [runAnalysis, setRunAnalysis] = useState(false)
  const url = 'http://localhost:5000/The_Amen_Break.wav'
  return (
    <div>
      {!runAnalysis ? (
        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-outline-dark" onClick={() => setRunAnalysis(true)}>
            Go!
          </button>
        </div>
      ) : (
        <AudioAnalyser url={url} lines={600}>
          {(data) => {
            const { error, peaks } = data
            if (error) return <ErrorMessage error={error} />
            return (
              <>
                <div className="ratio ratio-16x9">{!!peaks && <SvgFromAudioPeaks peaks={peaks} />}</div>
                <div className="">{!!peaks && <pre>{JSON.stringify(data, 0, 2)}</pre>}</div>
              </>
            )
          }}
        </AudioAnalyser>
      )}
    </div>
  )
}

const ErrorMessage = ({ error }) => (
  <div>
    <p>Something went wrong…</p>
    <pre>{JSON.stringify(error, 0, 2)}</pre>
  </div>
)

export default function Home() {
  return <AppLayout>{isBrowser() && <AudioWaveForm />}</AppLayout>
}
