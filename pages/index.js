import React, { useState, useEffect, useRef } from 'react'

import AppLayout from '../components/AppLayout'
import SvgFromAudioPeaks, {
  STYLES as VIS_STYLES,
} from '../components/SvgFromAudioPeaks'
import AudioAnalyser, {
  MIN_BANDS,
  MAX_BANDS,
  DEFAULT_BANDS,
} from '../components/AudioAnalyser'
import svgNodeToBlob from '../lib/svgNodeToBlob'
const isDev = process.env.NODE_ENV === 'development'

const SOURCE_URL = 'https://github.com/eins78/audioplotter'
const DEFAULT_AUDIO_URL = isDev
  ? 'http://localhost:5000/The_Amen_Break.wav'
  : 'https://upload.wikimedia.org/wikipedia/en/transcoded/8/80/The_Amen_Break%2C_in_context.ogg/The_Amen_Break%2C_in_context.ogg.mp3'
const DEFAULT_HEIGHT = 100
const MAX_HEIGHT = 2048
const DEFAULT_STROKE_WIDTH = 1
const MIN_STROKE_WIDTH = 0.1
const MAX_STROKE_WIDTH = 10
const STROKE_WIDTH_STEP = 0.1

const AudioWaveForm = () => {
  const [url, setUrl] = useState(DEFAULT_AUDIO_URL)
  const [imgHeight, setImgHeight] = useState(DEFAULT_HEIGHT)
  const [numBands, setNumBands] = useState(DEFAULT_BANDS)
  const [doNormalize, setDoNormalize] = useState(true)
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH)
  const [addCaps, setAddCaps] = useState(true)
  // NOTE: The "Go" button is needed, because we can use Browser audio API only after a user interaction!
  const [runAnalysis, setRunAnalysis] = useState(false)
  const [svgBlobURL, setSvgBlobURL] = useState(null)
  const svgEl = useRef(null)

  // FIXME: does not work on initial render… either find the correct way to hook it up,
  //        or make a "display SVG with download button" wrapper that should be up to date always?
  // alternative: *only* make that blob from React.renderToString(<svg/>) and embed this in the DOM. should save memory and be fast enough?
  useEffect(
    function makeSVGBlobURL() {
      const node = svgEl.current
      if (!node) return setSvgBlobURL(null)
      const blob = svgNodeToBlob(node)
      setSvgBlobURL(URL.createObjectURL(blob))

      return function cleanup() {
        svgBlobURL && URL.revokeObjectURL(svgBlobURL)
      }
    },
    [svgEl.current]
  )

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
          <select
            className="form-select"
            aria-label="choose visualisation style"
            required
          >
            {VIS_STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <NumberSliderInput
            id="inputHeight"
            labelTxt="height"
            value={imgHeight}
            onChange={(e) => setImgHeight(e.target.value)}
            required
            min={1}
            max={MAX_HEIGHT}
          />
          <NumberSliderInput
            id="inputNumBands"
            labelTxt="nr. of bands"
            value={numBands}
            onChange={(e) => setNumBands(e.target.value)}
            required
            min={MIN_BANDS}
            max={MAX_BANDS}
          />
          <NumberSliderInput
            id="inputStrokeWidth"
            labelTxt="stroke width"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(e.target.value)}
            required
            min={MIN_STROKE_WIDTH}
            max={MAX_STROKE_WIDTH}
            step={STROKE_WIDTH_STEP}
          />
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
            <button
              className="btn btn-outline-dark"
              onClick={() => setRunAnalysis(true)}
            >
              Go!
            </button>
          </div>
        )}
      </form>

      <hr />

      {runAnalysis && (
        <AudioAnalyser url={url} bands={numBands} normalize={doNormalize}>
          {(data) => {
            const { error, peaks } = data
            if (error) return <ErrorMessage error={error} />

            function downloadSVGNodeInDOM(filename = 'audioplot.svg') {
              // NOTE: goes around React straight to the DOM
              const node = document.querySelector('svg')
              if (!node) return

              const blob = svgNodeToBlob(node)
              const url = URL.createObjectURL(blob)

              // make a link and click it trigger the download
              const a = document.createElement('a')
              a.href = url
              a.download = filename
              a.click()
            }
            return (
              <>
                <div className="mb-3">
                  <div style={{ textAlign: 'center' }}>
                    <a
                      className={
                        svgBlobURL
                          ? 'btn btn-outline-dark'
                          : 'btn btn-outline-warning'
                      }
                      target="_blank"
                      download="audioplot.svg"
                      disabled={!svgBlobURL}
                      href={svgBlobURL}
                    >
                      Download blob!
                    </a>{' '}
                    <button
                      className="btn btn-outline-info"
                      target="_blank"
                      download="audioplot.svg"
                      onClick={() => downloadSVGNodeInDOM('audioplot.svg')}
                    >
                      Download from DOM!
                    </button>
                  </div>
                  <hr />
                </div>
                <div className="">
                  {!!peaks && (
                    <div data-style={{ border: '1px solid lightgray' }}>
                      <SvgFromAudioPeaks
                        ref={svgEl}
                        className="img-fluid w-100 shadow-sm p-3 mb-5 bg-body rounded"
                        peaks={peaks}
                        height={imgHeight}
                        strokeWidth={strokeWidth}
                        withCaps={addCaps}
                      />
                    </div>
                  )}
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
    <input
      id={id}
      type="checkbox"
      className="form-check-input"
      {...inputProps}
    />
    <label className="form-check-label" htmlFor={id}>
      {labelTxt}
    </label>
  </div>
)

const NumberSliderInput = ({ id, labelTxt, ...inputProps }) => (
  <div id={id} className="row">
    <div className="col-sm">
      <FormField
        id={`${id}Range`}
        type="range"
        className="form-range"
        labelTxt={labelTxt}
        {...inputProps}
      />
    </div>
    <div className="col-sm">
      <FormField id={`${id}Nr`} type="number" {...inputProps} />
    </div>
  </div>
)

export default function Home() {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])
  return (
    <AppLayout
      menu={[
        [
          <a
            href={SOURCE_URL}
            target="_blank"
            className="btn btn-sm btn-outline-secondary"
          >
            source
          </a>,
        ],
      ]}
    >
      {isClient && <AudioWaveForm />}
    </AppLayout>
  )
}
