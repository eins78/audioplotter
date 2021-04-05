import React, { useState } from 'react'

import AppLayout from '../components/AppLayout'
import SvgFromAudioPeaks from '../components/SvgFromAudioPeaks'
import AudioAnalyser, { MIN_LINES, MAX_LINES, DEFAULT_LINES } from '../components/AudioAnalyser'
const isBrowser = () => typeof window !== 'undefined'

const DEFAULT_AUDIO_URL = 'http://localhost:5000/The_Amen_Break.wav'

const AudioWaveForm = () => {
  const [url, setUrl] = useState(DEFAULT_AUDIO_URL)
  const [numLines, setNumLines] = useState(DEFAULT_LINES)
  const [doNormalize, setDoNormalize] = useState(true)
  const [runAnalysis, setRunAnalysis] = useState(false)

  return (
    <div>
      <form
        onSubmit={() => {
          setRunAnalysis(true)
        }}
      >
        <div className="mb-3">
          <FormField
            labelTxt="audiofile url"
            id="inputUrl"
            className="form-control form-control-sm"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <FormField
            id="inputNumLines"
            labelTxt="nr. of lines"
            helpTxt={String(numLines)}
            type="range"
            className="form-range"
            value={numLines}
            onChange={(e) => setNumLines(e.target.value)}
            required
            min={MIN_LINES}
            max={MAX_LINES}
          />
        </div>
        <div className="mb-3">
          <FormField
            id="inputDoNormalize"
            labelTxt="normalize"
            type="checkbox"
            className="form-control form-control-sm"
            value={doNormalize}
            onChange={(e) => {
              setNumLines(e.target.value)
              debugger
            }}
          />
        </div>
        {!runAnalysis && (
          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-outline-dark" onClick={() => setRunAnalysis(true)}>
              Go!
            </button>
          </div>
        )}
      </form>
      {runAnalysis && (
        <AudioAnalyser url={url} lines={numLines} normalize={false}>
          {(data) => {
            const { error, peaks } = data
            if (error) return <ErrorMessage error={error} />
            return (
              <>
                <div className="ratio ratio-16x9">{!!peaks && <SvgFromAudioPeaks peaks={peaks} />}</div>
                {/* <div className="">{!!peaks && <pre>{JSON.stringify(data, 0, 2)}</pre>}</div> */}
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

const FormField = ({ id, labelTxt, helpTxt, ...fieldProps }) => (
  <>
    <label htmlFor={id} className="form-label">
      {labelTxt}
    </label>
    <input id={id} className="form-control" {...fieldProps} />
    {!!helpTxt && (
      <div id={`${id}Help`} className="form-text">
        {helpTxt}
      </div>
    )}
  </>
)

export default function Home() {
  return <AppLayout>{isBrowser() && <AudioWaveForm />}</AppLayout>
}
