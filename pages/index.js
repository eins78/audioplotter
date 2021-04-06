import React, { useState } from 'react'

import AppLayout from '../components/AppLayout'
import SvgFromAudioPeaks, { STYLES as VIS_STYLES } from '../components/SvgFromAudioPeaks'
import AudioAnalyser, { MIN_LINES, MAX_LINES, DEFAULT_LINES } from '../components/AudioAnalyser'
const isBrowser = () => typeof window !== 'undefined'

const DEFAULT_AUDIO_URL = 'http://localhost:5000/The_Amen_Break.wav'

const AudioWaveForm = () => {
  const [url, setUrl] = useState(DEFAULT_AUDIO_URL)
  const [numLines, setNumLines] = useState(DEFAULT_LINES)
  const [doNormalize, setDoNormalize] = useState(true)
  const [addCaps, setAddCaps] = useState(true)
  // NOTE: The "Go" button is needed, because we can use Browser audio API only after a user interaction!
  const [runAnalysis, setRunAnalysis] = useState(false)

  return (
    <div>
      <form
        className="font-monospace small"
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
          <select className="form-select" aria-label="choose visualisation style">
            {/* <option selected>Open this select menu</option> */}
            {VIS_STYLES.map((s) => (
              <option value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <div className="row">
            <div className="col-sm">
              <FormField
                id="inputNumLinesRange"
                labelTxt="nr. of lines"
                type="range"
                className="form-range"
                value={numLines}
                onChange={(e) => setNumLines(e.target.value)}
                required
                min={MIN_LINES}
                max={MAX_LINES}
              />
            </div>
            <div className="col-sm">
              <FormField
                id="inputNumLinesNr"
                type="number"
                value={numLines}
                onChange={(e) => setNumLines(e.target.value)}
                required
                min={MIN_LINES}
                max={MAX_LINES}
              />
            </div>
          </div>
        </div>
        <div className="mb-3">
          <CheckBox
            labelTxt="normalize"
            id="inputDoNormalize"
            checked={doNormalize}
            onChange={(e) => {
              setDoNormalize(e.target.checked)
            }}
          />
          <CheckBox
            labelTxt="add Caps"
            id="inputAddCaps"
            checked={addCaps}
            onChange={(e) => {
              setAddCaps(e.target.checked)
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

      <hr />

      {runAnalysis && (
        <AudioAnalyser url={url} lines={numLines} normalize={doNormalize}>
          {(data) => {
            const { error, peaks } = data
            if (error) return <ErrorMessage error={error} />
            return (
              <>
                <div className="ratio ratio-16x9">
                  {!!peaks && <SvgFromAudioPeaks peaks={peaks} withCaps={addCaps} />}
                </div>
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

const FormField = ({ id, labelTxt, helpTxt, ...inputProps }) => (
  <>
    <label htmlFor={id} className="form-label">
      {labelTxt}
    </label>
    <input id={id} className="form-control" {...inputProps} />
    {!!helpTxt && (
      <div id={`${id}Help`} className="form-text">
        {helpTxt}
      </div>
    )}
  </>
)

const CheckBox = ({ id, labelTxt, ...inputProps }) => (
  <div className="form-check">
    <input id={id} type="checkbox" className="form-check-input" {...inputProps} />
    <label className="form-check-label" htmlFor={id}>
      {labelTxt}
    </label>
  </div>
)

export default function Home() {
  return <AppLayout>{isBrowser() && <AudioWaveForm />}</AppLayout>
}
