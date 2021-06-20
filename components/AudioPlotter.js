import React, { useState, useEffect, useRef, useCallback } from 'react'

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
import { debounce, Try, svgDomNodeToBlob } from '../util'

const isDev = process.env.NODE_ENV === 'development'
const DEV_HTTP_FETCH = true // do external network calls even in dev mode, to test that it works
const SHOW_BLOB_DOWNLOAD = false // isDev

const DEFAULT_AUDIO_URL =
  isDev && !DEV_HTTP_FETCH
    ? 'http://localhost:57915/The_Amen_Break.wav'
    : 'https://upload.wikimedia.org/wikipedia/en/transcoded/8/80/The_Amen_Break%2C_in_context.ogg/The_Amen_Break%2C_in_context.ogg.mp3'

const DEFAULT_VIS_STYLE = 'saw'

export default function AudioPlotter() {
  // form state
  const [url, setUrl] = useState(DEFAULT_AUDIO_URL)
  const [imgHeight, setImgHeight] = useState(DEFAULT_HEIGHT)
  const [numBands, setNumBands] = useState(DEFAULT_BANDS)
  const [audioTrimPoints, setAudioTrimPoints] = useState([0, 0])
  const [audioTrimPointsDebounced, setAudioTrimPointsDebounced] = useState([0, 0])
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
  // * stroke width
  const maxStrokeWidth = calcMaxStrokeWidth(numBands)
  function setStrokeWidth(num) {
    setStrokeWidthRaw(num < maxStrokeWidth ? num : maxStrokeWidth)
  }
  useEffect(() => {
    if (strokeWidth > maxStrokeWidth) setStrokeWidthRaw(maxStrokeWidth)
  }, [numBands])

  // * audio trim points
  const debounceAudioTrimPoints = useCallback(
    debounce((atp) => setAudioTrimPointsDebounced(atp), 50),
    []
  )
  const onChangeTrimStart = (event, where = 'start') => {
    const val = Try(() => parseFloat(event.target.value, 10))
    setAudioTrimPoints((atp) => (where === 'start' ? [val, atp[1]] : [atp[0], val]))
    debounceAudioTrimPoints((atp) => (where === 'start' ? [val, atp[1]] : [atp[0], val]))
  }
  const onChangeTrimEnd = (event) => onChangeTrimStart(event, 'end')

  // FIXME: does not work on initial render… either find the correct way to hook it up,
  //        or make a "display SVG with download button" wrapper that should be up to date always?
  // alternative: *only* make that blob from React.renderToString(<svg/>) and embed this in the DOM. should save memory and be fast enough?
  useEffect(
    function makeSVGBlobURL() {
      const node = svgEl.current
      if (!node) return setSvgBlobURL(null)
      const blob = svgDomNodeToBlob(node)
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
                {/* TODO: file info
                <pre className="mb-2">
                  <small>{bufferLength} bytes</small>
                </pre> */}
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
                          onChange={(e) => {
                            Try(() => setNumBands(parseInt(e.target.value, 10)))
                          }}
                          required
                          min={MIN_BANDS}
                          max={MAX_BANDS}
                        />
                      </div>
                    </div>

                    <div className="row mb-2">
                      <div className="col">
                        <NumberSliderInput
                          id="inputTrimStart"
                          labelTxt="trim start"
                          value={audioTrimPoints[0]}
                          onChange={onChangeTrimStart}
                          required
                          min={0}
                          max={99.99}
                          step={0.01}
                        />
                      </div>
                      <div className="col">
                        <NumberSliderInput
                          id="inputTrimEnd"
                          labelTxt="trim end"
                          value={audioTrimPoints[1]}
                          onChange={onChangeTrimEnd}
                          required
                          min={0}
                          max={99.99}
                          step={0.01}
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
                    {!!SHOW_BLOB_DOWNLOAD && (
                      <>
                        <a
                          className={svgBlobURL ? 'btn btn-outline-dark' : 'btn btn-outline-warning'}
                          target="_blank"
                          download="audioplot.svg"
                          disabled={!svgBlobURL}
                          href={svgBlobURL}
                        >
                          Download SVG (from blob!)
                        </a>{' '}
                      </>
                    )}
                    <button className="btn btn-outline-info" onClick={() => downloadSVGNodeInDOM('audioplot.svg')}>
                      Download SVG
                    </button>
                  </div>
                  <hr />
                </div>

                <AudioPeaks
                  buffer={buffer}
                  bands={numBands}
                  normalize={doNormalize}
                  trimPoints={audioTrimPointsDebounced}
                >
                  {({ peaks, decodeError }) => {
                    if (decodeError) return <ErrorMessage error={decodeError} />
                    return (
                      <div className="shadow-sm p-2 mb-5 bg-body rounded border">
                        {!!peaks && (
                          <SvgFromAudioPeaks
                            ref={svgEl}
                            className="img-fluid w-100 rounded"
                            peaks={peaks}
                            height={imgHeight}
                            style={visStyle}
                            strokeWidth={strokeWidth}
                            withCaps={addCaps}
                          />
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
  <div className="card text-center text-dark bg-warning mb-3 m-auto" style={{ maxWidth: '42em' }}>
    <div className="card-body">
      <h5 className="card-title">Something went wrong…</h5>
      <pre className="card-text">{error}</pre>
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

  const blob = svgDomNodeToBlob(node)
  const url = URL.createObjectURL(blob)

  // make a link and click it trigger the download
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}
