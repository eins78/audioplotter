import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryState, queryTypes } from 'next-usequerystate'
import { z } from 'zod'

import {
  AudioBuffer,
  AudioPeaks,
  MIN_BANDS,
  MAX_BANDS,
  DEFAULT_BANDS,
  MIN_FREQUENCY_BANDS,
  MAX_FREQUENCY_BANDS,
  DEFAULT_FREQUENCY_BANDS,
  DEFAULT_BAND_COLORS,
  FREQUENCY_PRESETS,
} from './AudioAnalyzer'
import SvgFromAudioPeaks, {
  STYLES as VIS_STYLES,
  DEFAULT_HEIGHT,
  MAX_HEIGHT,
  DEFAULT_STROKE_WIDTH,
  MIN_STROKE_WIDTH,
  STROKE_WIDTH_STEP,
  BLEND_MODES,
  DEFAULT_BLEND_MODE,
  DEFAULT_BACKGROUND_COLOR,
  calcMaxStrokeWidth,
} from './SvgFromAudioPeaks'
import CheckBox from './Form/CheckBox'
import { debounce, Try, svgDomNodeToBlob } from '../util'

const isDev = process.env.NODE_ENV === 'development'
const DEV_HTTP_FETCH = false // do network calls even in dev mode, to test that it works
const SHOW_BLOB_DOWNLOAD = false // isDev

const [DEFAULT_AUDIO_URL, DEFAULT_TRIM_POINTS] =
  isDev && !DEV_HTTP_FETCH
    ? ['http://localhost:57915/The_Amen_Break%2C_in_context.ogg.mp3', [32.78, 20.31]]
    : // ['http://localhost:57915/The_Amen_Break.wav', [0, 0]]
      [
        // 'https://upload.wikimedia.org/wikipedia/en/transcoded/8/80/The_Amen_Break%2C_in_context.ogg/The_Amen_Break%2C_in_context.ogg.mp3',
        '',
        [0, 0],
      ]

const DEFAULT_VIS_STYLE = 'saw'

// Transition options to prevent scroll-to-top on URL updates
const URL_UPDATE_OPTIONS = { scroll: false, shallow: true }

// Zod schema for bands array
const bandSchema = z.object({
  color: z.string(),
  opacity: z.number().min(0).max(1).optional(),
})
const bandsArraySchema = z.array(bandSchema)

// Custom parser for bands JSON
const bandsParser = {
  parse: (value) => {
    try {
      const parsed = JSON.parse(value)
      const validated = bandsArraySchema.parse(parsed)
      return validated
    } catch {
      return null
    }
  },
  serialize: (value) => {
    if (!value) return ''
    return JSON.stringify(value)
  },
}

export default function AudioPlotter() {
  // form state - URL persisted with validation
  const [url, setUrl] = useQueryState('url', { defaultValue: DEFAULT_AUDIO_URL })
  const [imgHeightRaw, setImgHeightRaw] = useQueryState('height', queryTypes.integer.withDefault(DEFAULT_HEIGHT))
  const imgHeight = Math.max(1, Math.min(imgHeightRaw, MAX_HEIGHT)) // Clamp to valid range
  const [numBandsRaw, setNumBandsRaw] = useQueryState('points', queryTypes.integer.withDefault(DEFAULT_BANDS))
  const numBands = Math.max(MIN_BANDS, Math.min(numBandsRaw, MAX_BANDS)) // Clamp to valid range
  const [trimStart, setTrimStart] = useQueryState('trimStart', queryTypes.float.withDefault(DEFAULT_TRIM_POINTS[0]))
  const [trimEnd, setTrimEnd] = useQueryState('trimEnd', queryTypes.float.withDefault(DEFAULT_TRIM_POINTS[1]))
  const [doNormalize, setDoNormalize] = useQueryState('normalize', queryTypes.boolean.withDefault(true))
  const [visStyle, setVisStyle] = useQueryState(
    'style',
    queryTypes.stringEnum(VIS_STYLES).withDefault(DEFAULT_VIS_STYLE)
  )
  const [strokeWidth, setStrokeWidthRaw] = useQueryState(
    'strokeWidth',
    queryTypes.float.withDefault(DEFAULT_STROKE_WIDTH)
  )
  const [addCaps, setAddCaps] = useQueryState('caps', queryTypes.boolean.withDefault(true))

  // Multiband URL state
  const [numFrequencyBands, setNumFrequencyBands] = useQueryState(
    'numBands',
    queryTypes.integer.withDefault(DEFAULT_FREQUENCY_BANDS)
  )
  const [bands, setBands] = useQueryState('bands', bandsParser)
  const [blendMode, setBlendMode] = useQueryState(
    'blendMode',
    queryTypes.stringEnum(BLEND_MODES).withDefault(DEFAULT_BLEND_MODE)
  )
  const [backgroundColor, setBackgroundColor] = useQueryState('bgColor', { defaultValue: DEFAULT_BACKGROUND_COLOR })

  // form state - not URL persisted
  const [audioFile, setAudioFile] = useState(null)
  const [audioTrimPointsDebounced, setAudioTrimPointsDebounced] = useState(DEFAULT_TRIM_POINTS)

  // Collapsible section state
  const [showAudioFile, setShowAudioFile] = useState(true)
  const [showFrequencyBands, setShowFrequencyBands] = useState(true)
  const [showWaveformSettings, setShowWaveformSettings] = useState(false)
  const [showPreviewSettings, setShowPreviewSettings] = useState(false)

  // Initialize/update bands array when numFrequencyBands changes
  useEffect(() => {
    const currentBands = bands || []
    const targetCount = numFrequencyBands || DEFAULT_FREQUENCY_BANDS

    if (currentBands.length !== targetCount) {
      const newBands = []
      for (let i = 0; i < targetCount; i++) {
        // Keep existing color and opacity if available, otherwise use defaults
        newBands.push({
          color: currentBands[i]?.color || DEFAULT_BAND_COLORS[i],
          opacity: currentBands[i]?.opacity !== undefined ? currentBands[i].opacity : 1,
        })
      }
      setBands(newBands, URL_UPDATE_OPTIONS)
    }
  }, [numFrequencyBands])

  // Build frequencyBands config from presets + colors + opacity
  const frequencyBands =
    numFrequencyBands > 1
      ? FREQUENCY_PRESETS[numFrequencyBands].map((preset, i) => ({
          name: preset.name,
          lowHz: preset.low,
          highHz: preset.high,
          color: bands?.[i]?.color || DEFAULT_BAND_COLORS[i],
          opacity: bands?.[i]?.opacity !== undefined ? bands[i].opacity : 1,
        }))
      : null

  // NOTE: The "Go" button is needed, because we can use Browser audio API only after a user interaction!
  const [runAnalysis, setRunAnalysis] = useState(false)
  // other state
  const [svgBlobURL, setSvgBlobURL] = useState(null)
  const svgEl = useRef(null)

  // Clean unknown URL params on mount only
  useEffect(() => {
    if (typeof window === 'undefined') return

    const knownParams = new Set([
      'url',
      'height',
      'points',
      'trimStart',
      'trimEnd',
      'normalize',
      'style',
      'strokeWidth',
      'caps',
      'numBands',
      'bands',
      'blendMode',
      'bgColor',
    ])

    const urlParams = new URLSearchParams(window.location.search)
    let hasUnknown = false

    for (const key of urlParams.keys()) {
      if (!knownParams.has(key)) {
        hasUnknown = true
        urlParams.delete(key)
      }
    }

    if (hasUnknown) {
      // Preserve scroll position
      const scrollX = window.scrollX
      const scrollY = window.scrollY
      const cleanUrl = urlParams.toString() ? `?${urlParams.toString()}` : window.location.pathname
      window.history.replaceState({}, '', cleanUrl)
      window.scrollTo(scrollX, scrollY)
    }
  }, [])

  // related fields:
  // * stroke width
  const maxStrokeWidth = calcMaxStrokeWidth(numBands)
  function setStrokeWidth(num) {
    setStrokeWidthRaw(num < maxStrokeWidth ? num : maxStrokeWidth, URL_UPDATE_OPTIONS)
  }
  useEffect(() => {
    if (strokeWidth > maxStrokeWidth) setStrokeWidthRaw(maxStrokeWidth, URL_UPDATE_OPTIONS)
  }, [numBands])

  // * audio trim points
  const audioTrimPoints = [trimStart, trimEnd]
  const debounceAudioTrimPoints = useCallback(
    debounce((atp) => setAudioTrimPointsDebounced(atp), 50),
    []
  )
  const onChangeTrimStart = (event) => {
    const val = Try(() => parseFloat(event.target.value, 10))
    setTrimStart(val, URL_UPDATE_OPTIONS)
    debounceAudioTrimPoints([val, trimEnd])
  }
  const onChangeTrimEnd = (event) => {
    const val = Try(() => parseFloat(event.target.value, 10))
    setTrimEnd(val, URL_UPDATE_OPTIONS)
    debounceAudioTrimPoints([trimStart, val])
  }

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
      {/* Audio File Section - Collapsible */}
      <div className="card border-0 shadow-sm mb-3">
        <div
          className="card-header text-start font-monospace py-2 bg-light"
          role="button"
          onClick={() => setShowAudioFile(!showAudioFile)}
          style={{ cursor: 'pointer' }}
        >
          {showAudioFile ? '▼' : '▶'} 📁 Audio File
        </div>
        {showAudioFile && (
          <div className="card-body font-monospace small">
            <div className="mb-3">
              <FormField
                labelTxt="audiofile url"
                id="inputUrl"
                className="form-control form-control-sm"
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value, URL_UPDATE_OPTIONS)
                  setAudioFile(null)
                }}
              />
            </div>

            <div className="mb-3 text-center small text-muted">— OR —</div>

            <div className="mb-3">
              <label htmlFor="inputFile" className="form-label small">
                upload audiofile
              </label>
              <input
                id="inputFile"
                className="form-control form-control-sm"
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    setAudioFile(file)
                    setUrl('', URL_UPDATE_OPTIONS)
                  }
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
          </div>
        )}
      </div>

      {(url || audioFile) && runAnalysis && (
        <AudioBuffer url={url} file={audioFile}>
          {({ isFetching, fetchError, bufferLength, buffer }) => {
            if (isFetching) return 'loading…'
            if (fetchError) return <ErrorMessage error={fetchError} />

            return (
              <>
                {/* Frequency Bands Section - Expanded by default */}
                <div className="card border-0 shadow-sm mb-3">
                  <div
                    className="card-header text-start font-monospace py-2 bg-light"
                    role="button"
                    onClick={() => setShowFrequencyBands(!showFrequencyBands)}
                    style={{ cursor: 'pointer' }}
                  >
                    {showFrequencyBands ? '▼' : '▶'} 🎵 Frequency Bands
                  </div>
                  {showFrequencyBands && (
                    <div className="card-body font-monospace small">
                      <NumberSliderInput
                        id="inputNumFrequencyBands"
                        labelTxt="number of bands"
                        value={numFrequencyBands}
                        onChange={(e) => {
                          Try(() => setNumFrequencyBands(parseInt(e.target.value, 10), URL_UPDATE_OPTIONS))
                        }}
                        required
                        min={MIN_FREQUENCY_BANDS}
                        max={MAX_FREQUENCY_BANDS}
                      />

                      {numFrequencyBands > 1 && bands && (
                        <div className="mt-3">
                          {FREQUENCY_PRESETS[numFrequencyBands].map((preset, i) => (
                            <div key={i} className="card mb-2">
                              <div className="card-body py-2 px-3">
                                <div className="row align-items-center mb-2">
                                  <div className="col">
                                    <small>
                                      <strong>Band {i + 1}:</strong> {preset.name} ({preset.low}-{preset.high} Hz)
                                    </small>
                                  </div>
                                  <div className="col-auto">
                                    <input
                                      type="color"
                                      className="form-control form-control-color"
                                      value={bands[i]?.color || DEFAULT_BAND_COLORS[i]}
                                      onChange={(e) => {
                                        const newBands = [...bands]
                                        newBands[i] = { ...newBands[i], color: e.target.value }
                                        setBands(newBands, URL_UPDATE_OPTIONS)
                                      }}
                                      title="Choose color"
                                    />
                                  </div>
                                </div>
                                <div className="row align-items-center">
                                  <div className="col-3">
                                    <small className="text-muted">opacity</small>
                                  </div>
                                  <div className="col">
                                    <input
                                      type="range"
                                      className="form-range"
                                      min="0"
                                      max="1"
                                      step="0.01"
                                      value={bands[i]?.opacity !== undefined ? bands[i].opacity : 1}
                                      onChange={(e) => {
                                        const newBands = [...bands]
                                        newBands[i] = { ...newBands[i], opacity: parseFloat(e.target.value) }
                                        setBands(newBands, URL_UPDATE_OPTIONS)
                                      }}
                                    />
                                  </div>
                                  <div className="col-auto">
                                    <small className="text-muted">
                                      {Math.round((bands[i]?.opacity !== undefined ? bands[i].opacity : 1) * 100)}%
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Waveform Settings Section - Collapsed by default */}
                <div className="card border-0 shadow-sm mb-3">
                  <div
                    className="card-header text-start font-monospace py-2 bg-light"
                    role="button"
                    onClick={() => setShowWaveformSettings(!showWaveformSettings)}
                    style={{ cursor: 'pointer' }}
                  >
                    {showWaveformSettings ? '▼' : '▶'} ⚙️ Waveform Settings
                  </div>
                  {showWaveformSettings && (
                    <div className="card-body font-monospace small">
                      <div className="mb-3">
                        <label className="form-label small">style</label>
                        <select
                          className="form-select"
                          aria-label="choose visualisation style"
                          value={visStyle}
                          onChange={(e) => setVisStyle(e.target.value, URL_UPDATE_OPTIONS)}
                          required
                        >
                          {VIS_STYLES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="row mb-2">
                        <div className="col">
                          <NumberSliderInput
                            id="inputHeight"
                            labelTxt="height"
                            value={imgHeight}
                            onChange={(e) => setImgHeightRaw(e.target.value, URL_UPDATE_OPTIONS)}
                            required
                            min={1}
                            max={MAX_HEIGHT}
                          />
                        </div>
                        <div className="col">
                          <NumberSliderInput
                            id="inputNumBands"
                            labelTxt="points"
                            value={numBands}
                            onChange={(e) => {
                              Try(() => setNumBandsRaw(parseInt(e.target.value, 10), URL_UPDATE_OPTIONS))
                            }}
                            required
                            min={MIN_BANDS}
                            max={MAX_BANDS}
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
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

                      <div className="mb-3">
                        <CheckBox
                          labelTxt="normalize"
                          id="inputDoNormalize"
                          checked={doNormalize}
                          onChange={(e) => {
                            setDoNormalize(e.target.checked, URL_UPDATE_OPTIONS)
                          }}
                        />
                        <CheckBox
                          labelTxt="add Caps"
                          id="inputAddCaps"
                          checked={addCaps}
                          onChange={(e) => {
                            setAddCaps(e.target.checked, URL_UPDATE_OPTIONS)
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Settings Section - Collapsed by default */}
                <div className="card border-0 shadow-sm mb-3">
                  <div
                    className="card-header text-start font-monospace py-2 bg-light"
                    role="button"
                    onClick={() => setShowPreviewSettings(!showPreviewSettings)}
                    style={{ cursor: 'pointer' }}
                  >
                    {showPreviewSettings ? '▼' : '▶'} 🎨 Preview Settings
                  </div>
                  {showPreviewSettings && (
                    <div className="card-body font-monospace small">
                      <NumberSliderInput
                        id="inputStrokeWidth"
                        labelTxt="stroke width"
                        value={strokeWidth}
                        onChange={({ target: { value: num } }) => {
                          setStrokeWidth(num < maxStrokeWidth ? num : maxStrokeWidth, URL_UPDATE_OPTIONS)
                        }}
                        required
                        min={MIN_STROKE_WIDTH}
                        max={maxStrokeWidth}
                        step={STROKE_WIDTH_STEP}
                      />

                      <div className="row mb-3">
                        <div className="col">
                          <label className="form-label small">blend mode</label>
                          <select
                            className="form-select"
                            aria-label="choose blend mode"
                            value={blendMode}
                            onChange={(e) => setBlendMode(e.target.value, URL_UPDATE_OPTIONS)}
                            required
                          >
                            {BLEND_MODES.map((mode) => (
                              <option key={mode} value={mode}>
                                {mode}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col">
                          <label className="form-label small">background color</label>
                          <input
                            type="color"
                            className="form-control form-control-color w-100"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value, URL_UPDATE_OPTIONS)}
                            title="Choose background color"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <hr />

                <div className="mb-3">
                  <div style={{ textAlign: 'center' }}>
                    {!!SHOW_BLOB_DOWNLOAD && (
                      <>
                        <a
                          className={svgBlobURL ? 'btn btn-outline-dark' : 'btn btn-outline-warning'}
                          target="_blank"
                          download={generateFilename(audioFile || url, {
                            height: imgHeight,
                            points: numBands,
                            numBands: numFrequencyBands,
                            trimStart: audioTrimPoints[0],
                            trimEnd: audioTrimPoints[1],
                            normalize: doNormalize,
                            addCaps: addCaps,
                          })}
                          disabled={!svgBlobURL}
                          href={svgBlobURL}
                        >
                          Download SVG (from blob!)
                        </a>{' '}
                      </>
                    )}
                    <button
                      className="btn btn-outline-primary"
                      onClick={() =>
                        downloadSVGNodeInDOM(
                          generateFilename(audioFile || url, {
                            height: imgHeight,
                            points: numBands,
                            numBands: numFrequencyBands,
                            trimStart: audioTrimPoints[0],
                            trimEnd: audioTrimPoints[1],
                            normalize: doNormalize,
                            addCaps: addCaps,
                          })
                        )
                      }
                    >
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
                  frequencyBands={frequencyBands}
                >
                  {({ bandPeaks, decodeError }) => {
                    if (decodeError) return <ErrorMessage error={decodeError} />
                    return (
                      <div className="shadow-sm p-2 mb-5 bg-body rounded border">
                        {!!bandPeaks && (
                          <SvgFromAudioPeaks
                            ref={svgEl}
                            className="img-fluid w-100 rounded"
                            bandPeaks={bandPeaks}
                            height={imgHeight}
                            style={visStyle}
                            strokeWidth={strokeWidth}
                            withCaps={addCaps}
                            backgroundColor={backgroundColor}
                            blendMode={blendMode}
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

function generateFilename(audioSource, settings) {
  let decodedBasename

  // Handle File object
  if (audioSource instanceof File) {
    const basename = audioSource.name.replace(/\.[^.]+$/, '') // remove extension
    decodedBasename = basename
  } else {
    // Handle URL string
    const urlPath = audioSource.split('/').pop()
    const basename = urlPath.split('?')[0].replace(/\.[^.]+$/, '') // remove query params and extension
    decodedBasename = decodeURIComponent(basename)
  }

  // Normalize: lowercase, replace spaces/special chars with dashes, alphanumerics only
  const normalizedBasename = decodedBasename
    .toLowerCase()
    .replace(/\s+/g, '-') // spaces to dashes
    .replace(/[^a-z0-9-]/g, '-') // non-alphanumeric to dashes
    .replace(/-+/g, '-') // collapse multiple dashes
    .replace(/^-|-$/g, '') // remove leading/trailing dashes

  // Build settings string
  const h = `h${settings.height}`
  const p = `p${settings.points}`
  const numBands = `${settings.numBands}band`
  const ts = `ts${settings.trimStart}`
  const te = `te${settings.trimEnd}`
  const norm = `norm${settings.normalize ? 'yes' : 'no'}`
  const caps = `caps${settings.addCaps ? 'yes' : 'no'}`

  return `audioplot-${normalizedBasename}-${h}-${p}-${numBands}-${ts}-${te}-${norm}-${caps}.svg`
}

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
