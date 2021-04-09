import React, { useState, useEffect, useRef } from 'react'

import { AudioBuffer, AudioPeaks, MIN_BANDS, MAX_BANDS, DEFAULT_BANDS } from './AudioAnalyzer'
import SvgFromAudioPeaks, {
  STYLES as VIS_STYLES,
  DEFAULT_HEIGHT,
  MAX_HEIGHT,
  DEFAULT_STROKE_WIDTH,
  MIN_STROKE_WIDTH,
  STROKE_WIDTH_STEP,
  calcMaxStrokeWidth,
} from './SvgFromAudioPeaks'
import svgNodeToBlob from '../lib/svgNodeToBlob'
const isDev = process.env.NODE_ENV === 'development'

const DEFAULT_AUDIO_URL = isDev
  ? 'http://localhost:5000/The_Amen_Break.wav'
  : 'https://upload.wikimedia.org/wikipedia/en/transcoded/8/80/The_Amen_Break%2C_in_context.ogg/The_Amen_Break%2C_in_context.ogg.mp3'

const DEFAULT_VIS_STYLE = 'saw'

export default function AudioPlotter() {
  // form state
  const [url, setUrl] = useState(DEFAULT_AUDIO_URL)
  const [imgHeight, setImgHeight] = useState(DEFAULT_HEIGHT)
  const [numBands, setNumBands] = useState(DEFAULT_BANDS)
  const [doNormalize, setDoNormalize] = useState(true)
  const [visStyle, setVisStyle] = useState(DEFAULT_VIS_STYLE)
  const [strokeWidth, setStrokeWidthRaw] = useState(DEFAULT_STROKE_WIDTH)
  const [addCaps, setAddCaps] = useState(true)
  // NOTE: The "Go" button is needed, because we can use Browser audio API only after a user interaction!
  const [runAnalysis, setRunAnalysis] = useState(false)
  // other state
  const [svgBlobURL, setSvgBlobURL] = useState(null)
  const svgEl = useRef(null)

  // related fields:
  const maxStrokeWidth = calcMaxStrokeWidth(numBands)
  function setStrokeWidth(num) {
    setStrokeWidthRaw(num < maxStrokeWidth ? num : maxStrokeWidth)
  }
  useEffect(() => {
    if (strokeWidth > maxStrokeWidth) setStrokeWidthRaw(maxStrokeWidth)
  }, [numBands])

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

        {!runAnalysis && (
          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-outline-dark" onClick={() => setRunAnalysis(true)}>
              Go!
            </button>
          </div>
        )}
      </form>

      <hr />

      {url && runAnalysis && (
        <AudioBuffer url={url}>
          {({ isFetching, fetchError, bufferLength, buffer }) => {
            if (isFetching) return 'loading…'
            if (fetchError) return <ErrorMessage error={fetchError} />

            return (
              <>
                <form
                  className="font-monospace small"
                  onSubmit={() => {
                    setRunAnalysis(true)
                  }}
                >
                  <div className="mb-3">
                    <select
                      className="form-select"
                      aria-label="choose visualisation style"
                      value={visStyle}
                      onChange={(e) => setVisStyle(e.target.value)}
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
                    <div className="row mb-2">
                      <div className="col">
                        <NumberSliderInput
                          id="inputHeight"
                          labelTxt="height"
                          value={imgHeight}
                          onChange={(e) => setImgHeight(e.target.value)}
                          required
                          min={1}
                          max={MAX_HEIGHT}
                        />
                      </div>
                      <div className="col">
                        <NumberSliderInput
                          id="inputNumBands"
                          labelTxt="nr. of bands"
                          value={numBands}
                          onChange={(e) => setNumBands(e.target.value)}
                          required
                          min={MIN_BANDS}
                          max={MAX_BANDS}
                        />
                      </div>
                    </div>
                    <NumberSliderInput
                      id="inputStrokeWidth"
                      labelTxt="stroke width"
                      value={strokeWidth}
                      onChange={({ target: { value: num } }) => {
                        setStrokeWidth(num < maxStrokeWidth ? num : maxStrokeWidth)
                      }}
                      required
                      min={MIN_STROKE_WIDTH}
                      max={maxStrokeWidth}
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
                </form>

                <hr />

                <div className="mb-3">
                  <div style={{ textAlign: 'center' }}>
                    <a
                      className={svgBlobURL ? 'btn btn-outline-dark' : 'btn btn-outline-warning'}
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

                <AudioPeaks buffer={buffer} bands={numBands} normalize={doNormalize} trimPoints={audioTrimPoints}>
                  {({ peaks, decodeError }) => {
                    if (decodeError) return <ErrorMessage error={decodeError} />
                    return (
                      <div className="">
                        {!!peaks && (
                          <div data-style={{ border: '1px solid lightgray' }}>
                            <SvgFromAudioPeaks
                              ref={svgEl}
                              className="img-fluid w-100 shadow-sm p-3 mb-5 bg-body rounded"
                              peaks={peaks}
                              height={imgHeight}
                              style={visStyle}
                              strokeWidth={strokeWidth}
                              withCaps={addCaps}
                            />
                          </div>
                        )}
                      </div>
                    )
                  }}
                </AudioPeaks>
              </>
            )
          }}
        </AudioBuffer>
      )}
    </div>
  )
}

const ErrorMessage = ({ error, children }) => (
  <div class="card text-center text-dark bg-warning mb-3 m-auto" style={{ maxWidth: '42em' }}>
    <div class="card-body">
      <h5 class="card-title">Something went wrong…</h5>
      <pre class="card-text">{error}</pre>
      {children}
    </div>
  </div>
)

const FormField = ({ id, labelTxt, helpTxt, ...inputProps }) => (
  <>
    <label htmlFor={id} className="form-label small">
      {labelTxt}
    </label>
    <input id={id} className="form-control form-control-sm" {...inputProps} />
    {!!helpTxt && (
      <div id={`${id}Help`} className="form-text small">
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

const NumberSliderInput = ({ id, labelTxt, ...inputProps }) => (
  <div id={id} className="row mb-2">
    <div className="col">
      <FormField id={`${id}Range`} type="range" className="form-range" labelTxt={labelTxt} {...inputProps} />
    </div>
    <div className="col">
      <FormField id={`${id}Nr`} type="number" {...inputProps} />
    </div>
  </div>
)

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
