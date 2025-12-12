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
import Panzoom from '@panzoom/panzoom'
import { useLocalStorage } from 'usehooks-ts'

const isDev = process.env.NODE_ENV === 'development'
const DEV_HTTP_FETCH = false // do network calls even in dev mode, to test that it works
const SHOW_BLOB_DOWNLOAD = false // isDev

const [DEFAULT_AUDIO_URL, DEFAULT_TRIM_POINTS] =
  isDev && !DEV_HTTP_FETCH
    ? ['http://localhost:57915/amen-break.mp3', [32.78, 20.31]]
    : [
        // Default to empty URL in production to let users choose
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
  const [strokeWidthRaw, setStrokeWidthRaw] = useQueryState(
    'strokeWidth',
    queryTypes.float.withDefault(DEFAULT_STROKE_WIDTH)
  )
  const [addCaps, setAddCaps] = useQueryState('caps', queryTypes.boolean.withDefault(true))

  // Validate strokeWidth with dynamic max based on numBands
  const maxStrokeWidth = calcMaxStrokeWidth(numBands)
  const strokeWidth = Math.max(MIN_STROKE_WIDTH, Math.min(strokeWidthRaw, maxStrokeWidth))

  // Multiband URL state with validation
  const [numFrequencyBandsRaw, setNumFrequencyBandsRaw] = useQueryState(
    'numBands',
    queryTypes.integer.withDefault(DEFAULT_FREQUENCY_BANDS)
  )
  const numFrequencyBands = Math.max(MIN_FREQUENCY_BANDS, Math.min(numFrequencyBandsRaw, MAX_FREQUENCY_BANDS))
  const [bands, setBands] = useQueryState('bands', bandsParser)
  const [blendMode, setBlendMode] = useQueryState(
    'blendMode',
    queryTypes.stringEnum(BLEND_MODES).withDefault(DEFAULT_BLEND_MODE)
  )
  const [backgroundColor, setBackgroundColor] = useQueryState('bgColor', { defaultValue: DEFAULT_BACKGROUND_COLOR })
  const [spreadPeaks, setSpreadPeaks] = useQueryState('spreadPeaks', queryTypes.boolean.withDefault(false))
  const [stickyPreview, setStickyPreview] = useLocalStorage('stickyPreview', true)

  // form state - not URL persisted
  const [audioFile, setAudioFile] = useState(null)
  const [audioTrimPointsDebounced, setAudioTrimPointsDebounced] = useState(DEFAULT_TRIM_POINTS)

  // Collapsible section state
  const [showAudioFile, setShowAudioFile] = useState(true)
  const [showFrequencyBands, setShowFrequencyBands] = useState(true)
  const [showWaveformSettings, setShowWaveformSettings] = useState(false)
  const [showPreviewSettings, setShowPreviewSettings] = useState(false)

  // Preview panel resize state
  const [previewHeight, setPreviewHeight] = useLocalStorage('previewHeight', '40vh')
  const [isDragging, setIsDragging] = useState(false)

  // Resize handlers
  const handleDragStart = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
    document.body.classList.add('preview-dragging')
  }, [])

  const handleDragMove = useCallback(
    (e) => {
      if (!isDragging || !previewPanelRef.current) return

      // Cancel previous frame if still pending
      if (dragAnimationFrameRef.current) {
        cancelAnimationFrame(dragAnimationFrameRef.current)
      }

      // Use requestAnimationFrame to throttle to 60fps max
      dragAnimationFrameRef.current = requestAnimationFrame(() => {
        const viewportHeight = window.innerHeight
        const mouseY = e.clientY || e.touches?.[0]?.clientY
        if (!mouseY) return

        const newHeightPx = viewportHeight - mouseY
        const newHeightVh = (newHeightPx / viewportHeight) * 100
        const clampedVh = Math.max(20, Math.min(80, newHeightVh))

        // Update CSS custom property directly (no React state update during drag)
        previewPanelRef.current.style.setProperty('--preview-height', `${clampedVh}vh`)
      })
    },
    [isDragging]
  )

  const handleDragEnd = useCallback(() => {
    if (isDragging && previewPanelRef.current) {
      setIsDragging(false)
      document.body.classList.remove('preview-dragging')

      // Cancel any pending animation frame
      if (dragAnimationFrameRef.current) {
        cancelAnimationFrame(dragAnimationFrameRef.current)
      }

      // Save final height to state (useLocalStorage handles persistence)
      const finalHeight = previewPanelRef.current.style.getPropertyValue('--preview-height') || '40vh'
      setPreviewHeight(finalHeight)
    }
  }, [isDragging])

  const handleKeyboardResize = useCallback(
    (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const currentVh = parseFloat(previewHeight)
        const delta = e.key === 'ArrowUp' ? -5 : 5
        const newVh = Math.max(20, Math.min(80, currentVh + delta))
        setPreviewHeight(`${newVh}vh`)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        setPreviewHeight('40vh')
      }
    },
    [previewHeight]
  )

  // Attach drag event listeners
  useEffect(() => {
    if (isDragging) {
      const handleMove = (e) => handleDragMove(e)
      const handleEnd = () => handleDragEnd()

      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchmove', handleMove)
      document.addEventListener('touchend', handleEnd)

      return () => {
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleEnd)
        document.removeEventListener('touchmove', handleMove)
        document.removeEventListener('touchend', handleEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Reference to preview content for scrolling
  const previewContentRef = useRef(null)

  // Initialize/update bands array when numFrequencyBands changes
  useEffect(() => {
    const currentBands = bands || []
    const targetCount = numFrequencyBands || DEFAULT_FREQUENCY_BANDS
    const previousCount = currentBands.length

    if (previousCount !== targetCount) {
      const newBands = []
      // Always reset to default colors when band count changes
      // For multiband mode (2+), skip black (index 0) which is reserved for single-band
      const isMultiband = targetCount > 1

      for (let i = 0; i < targetCount; i++) {
        newBands.push({
          color: isMultiband ? DEFAULT_BAND_COLORS[i + 1] : DEFAULT_BAND_COLORS[i],
          opacity: 1,
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

  // Preview panel state management
  // States: 'no-audio' | 'ready' | 'loading' | 'error' | 'success'
  const [previewState, setPreviewState] = useState('no-audio')
  const [previewError, setPreviewError] = useState(null)

  // Update preview state when audio source changes
  useEffect(() => {
    if (url || audioFile) {
      // Audio is loaded, set to ready if not already processing/showing
      if (previewState === 'no-audio') {
        setPreviewState('ready')
      }
    } else {
      // No audio, reset to initial state
      setPreviewState('no-audio')
      setPreviewError(null)
      setHasWaveform(false)
    }
  }, [url, audioFile])

  // Reset hasWaveform when starting new generation
  useEffect(() => {
    if (previewState === 'loading') {
      setHasWaveform(false)
    }
  }, [previewState])

  // Auto-regenerate when settings change (if already showing success)
  const settingsHash = JSON.stringify({
    numBands,
    imgHeight,
    visStyle,
    strokeWidth,
    doNormalize,
    addCaps,
    numFrequencyBands,
    bands,
    blendMode,
    backgroundColor,
    spreadPeaks,
    trim: audioTrimPointsDebounced,
  })
  const prevSettingsHash = useRef(settingsHash)

  useEffect(() => {
    if (previewState === 'success' && prevSettingsHash.current !== settingsHash) {
      setPreviewState('loading')
    }
    prevSettingsHash.current = settingsHash
  }, [settingsHash, previewState])

  // other state
  const [svgBlobURL, setSvgBlobURL] = useState(null)
  const svgEl = useRef(null)
  const previewPanelRef = useRef(null)
  const dragAnimationFrameRef = useRef(null)
  const [hasWaveform, setHasWaveform] = useState(false)

  // Panzoom state
  const panzoomContainerRef = useRef(null)
  const panzoomInstanceRef = useRef(null)

  // Transition to success when bandPeaks become available
  useEffect(() => {
    if (hasWaveform && previewState === 'loading') {
      setPreviewState('success')
    }
  }, [hasWaveform, previewState])

  // Initialize panzoom when waveform is available
  useEffect(() => {
    const container = panzoomContainerRef.current
    if (!container || !hasWaveform) return

    const panzoom = Panzoom(container, {
      maxScale: 10,
      minScale: 0.1,
      animate: true,
      duration: 200,
      excludeClass: 'panzoom-exclude',
    })
    panzoomInstanceRef.current = panzoom

    // Enable mouse wheel zooming on the parent (preview-content)
    const parent = container.parentElement
    const handleWheel = (e) => {
      e.preventDefault()
      panzoom.zoomWithWheel(e)
    }
    parent.addEventListener('wheel', handleWheel, { passive: false })

    // Cleanup
    return () => {
      parent.removeEventListener('wheel', handleWheel)
      panzoom.destroy()
      panzoomInstanceRef.current = null
    }
  }, [hasWaveform])

  // Zoom control handlers
  const handleZoomIn = useCallback(() => panzoomInstanceRef.current?.zoomIn(), [])
  const handleZoomOut = useCallback(() => panzoomInstanceRef.current?.zoomOut(), [])
  const handleFitAll = useCallback(() => {
    panzoomInstanceRef.current?.reset({ animate: false })
  }, [])

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
      'spreadPeaks',
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

  // Auto-adjust strokeWidth if numBands changes and it exceeds new max
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
    <>
      {/* Controls Section */}
      <div className={stickyPreview ? 'controls-section' : ''}>
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
          </div>
        )}
      </div>

      {/* Controls only show when generating/generated */}
      {(previewState === 'loading' || previewState === 'success') && (
        <AudioBuffer url={url} file={audioFile}>
          {({ isFetching, fetchError, bufferLength, buffer }) => {
            // Handle fetch errors
            if (fetchError) {
              if (previewState !== 'error') {
                setTimeout(() => {
                  setPreviewError(fetchError)
                  setPreviewState('error')
                }, 0)
              }
              return null
            }

            if (isFetching) return null

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
                          Try(() => setNumFrequencyBandsRaw(parseInt(e.target.value, 10), URL_UPDATE_OPTIONS))
                        }}
                        required
                        min={MIN_FREQUENCY_BANDS}
                        max={MAX_FREQUENCY_BANDS}
                      />

                      {numFrequencyBands > 1 && (
                        <div className="mb-3 mt-3">
                          <label className="form-label small">spread peaks</label>
                          <div>
                            <CheckBox
                              checked={spreadPeaks}
                              onChange={(e) => setSpreadPeaks(e.target.checked, URL_UPDATE_OPTIONS)}
                            
                            />
                          </div>
                          <small className="text-muted d-block mt-1">
                            Interleave band peaks horizontally instead of stacking at same positions
                          </small>
                        </div>
                      )}

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
                          setStrokeWidthRaw(Math.max(MIN_STROKE_WIDTH, Math.min(num, maxStrokeWidth)), URL_UPDATE_OPTIONS)
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

                      <div className="mb-3">
                        <CheckBox
                          labelTxt="sticky preview"
                          id="inputStickyPreview"
                          checked={stickyPreview}
                          onChange={(e) => setStickyPreview(e.target.checked)}
                        />
                        <small className="text-muted d-block mt-1">
                          Keep preview visible at bottom while scrolling
                        </small>
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
                            spreadPeaks: spreadPeaks,
                          })
                        )
                      }
                    >
                      Download SVG
                    </button>
                  </div>
                  <hr />
                </div>
              </>
            )
          }}
        </AudioBuffer>
      )}
      </div>
      {/* End Controls Section */}

      {/* Unified Preview Panel - Always visible, shows different states */}
      <div
        ref={previewPanelRef}
        className={stickyPreview ? 'preview-panel' : 'preview-panel-inline'}
        style={stickyPreview ? { ['--preview-height']: previewHeight } : {}}
      >
        <div
          className="drag-handle"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize preview panel"
          aria-valuenow={parseFloat(previewHeight)}
          aria-valuemin={20}
          aria-valuemax={80}
          tabIndex={0}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onKeyDown={handleKeyboardResize}
        />
        <div ref={previewContentRef} className="preview-content">
          {previewState === 'no-audio' && <EmptyState />}
          {previewState === 'ready' && (
            <ReadyState
              onGenerate={() => {
                setPreviewState('loading')
                setShowAudioFile(false)
              }}
            />
          )}
          {(previewState === 'loading' || previewState === 'success') && (
            <AudioBuffer url={url} file={audioFile}>
              {({ isFetching, fetchError, bufferLength, buffer }) => {
                // Handle fetch errors
                if (fetchError) {
                  if (previewState !== 'error') {
                    setTimeout(() => {
                      setPreviewError(fetchError)
                      setPreviewState('error')
                    }, 0)
                  }
                  return null
                }

                if (isFetching) return <LoadingState />

                return (
                  <AudioPeaks
                    buffer={buffer}
                    bands={numBands}
                    normalize={doNormalize}
                    trimPoints={audioTrimPointsDebounced}
                    frequencyBands={frequencyBands}
                  >
                    {({ bandPeaks, decodeError }) => {
                      // Handle decode errors
                      if (decodeError) {
                        if (previewState !== 'error') {
                          setTimeout(() => {
                            setPreviewError(decodeError)
                            setPreviewState('error')
                          }, 0)
                        }
                        return null
                      }

                      // Update hasWaveform flag when bandPeaks available
                      if (bandPeaks && !hasWaveform) {
                        // Use queueMicrotask to defer state update outside render
                        queueMicrotask(() => setHasWaveform(true))
                      }

                      // Render waveform with panzoom and toolbars
                      return !!bandPeaks ? (
                        <>
                          {/* Left toolbar: Zoom controls */}
                          <div className="preview-toolbar preview-toolbar-left panzoom-exclude">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={handleZoomIn}
                              title="Zoom in"
                              aria-label="Zoom in"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={handleZoomOut}
                              title="Zoom out"
                              aria-label="Zoom out"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={handleFitAll}
                              title="Fit all"
                              aria-label="Fit all"
                            >
                              ⊡
                            </button>
                          </div>

                          {/* Panzoom container wrapping SVG */}
                          <div ref={panzoomContainerRef} className="panzoom-container">
                            <SvgFromAudioPeaks
                              ref={svgEl}
                              className="img-fluid"
                              bandPeaks={bandPeaks}
                              height={imgHeight}
                              style={visStyle}
                              strokeWidth={strokeWidth}
                              withCaps={addCaps}
                              backgroundColor={backgroundColor}
                              blendMode={blendMode}
                              spreadPeaks={spreadPeaks}
                            />
                          </div>

                          {/* Right toolbar: Unstick + Download */}
                          <div className="preview-toolbar preview-toolbar-right panzoom-exclude">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => setStickyPreview(!stickyPreview)}
                              title={stickyPreview ? 'Unstick preview' : 'Stick preview'}
                              aria-label={stickyPreview ? 'Unstick preview' : 'Stick preview'}
                            >
                              {stickyPreview ? '📌' : '📍'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
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
                                    spreadPeaks: spreadPeaks,
                                  })
                                )
                              }
                              title="Download SVG"
                              aria-label="Download SVG"
                            >
                              ⬇
                            </button>
                          </div>
                        </>
                      ) : null
                    }}
                  </AudioPeaks>
                )
              }}
            </AudioBuffer>
          )}
          {previewState === 'error' && (
            <ErrorState
              error={previewError}
              onRetry={() => {
                setPreviewState('loading')
                setPreviewError(null)
              }}
            />
          )}
        </div>
      </div>
    </>
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

const EmptyState = () => (
  <div className="preview-placeholder">
    <div className="text-center">
      <div className="mb-3" style={{ fontSize: '3rem' }}>
        🎵
      </div>
      <h5>Upload an audio file to begin</h5>
    </div>
  </div>
)

const ReadyState = ({ onGenerate }) => (
  <div className="preview-placeholder">
    <div className="text-center">
      <div className="mb-3" style={{ fontSize: '2rem' }}>
        🎵
      </div>
      <p className="mb-3">Ready to generate your waveform</p>
      <button className="btn btn-primary btn-lg" onClick={onGenerate} type="button">
        Generate Waveform
      </button>
    </div>
  </div>
)

const LoadingState = () => (
  <div className="preview-placeholder">
    <div className="text-center">
      <div className="mb-3">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
      <p className="text-muted">Generating...</p>
    </div>
  </div>
)

const ErrorState = ({ error, onRetry }) => (
  <div className="preview-placeholder">
    <div className="text-center">
      <div className="mb-3" style={{ fontSize: '2rem' }}>
        ⚠️
      </div>
      <h5 className="text-danger mb-2">Error</h5>
      <p className="text-muted small mb-3">{error || 'Something went wrong'}</p>
      <button className="btn btn-outline-primary" onClick={onRetry} type="button">
        Retry
      </button>
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
  const spread = `spread${settings.spreadPeaks ? 'yes' : 'no'}`

  return `audioplot-${normalizedBasename}-${h}-${p}-${numBands}-${ts}-${te}-${norm}-${caps}-${spread}.svg`
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
