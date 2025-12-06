import React, { useState, useEffect, useRef, useCallback } from 'react'

import { AudioBuffer, AudioPeaks, MIN_BANDS, MAX_BANDS, DEFAULT_BANDS } from './AudioAnalyzer'
import SvgFromAudioPeaks, {
  STYLES as VIS_STYLES,
  type StyleType,
  DEFAULT_HEIGHT,
  MAX_HEIGHT,
  DEFAULT_STROKE_WIDTH,
  MIN_STROKE_WIDTH,
  STROKE_WIDTH_STEP,
  calcMaxStrokeWidth,
} from './SvgFromAudioPeaks'
import CheckBox from './Form/CheckBox'
import { debounce, Try, svgDomNodeToBlob } from '../util'

const isDev = import.meta.env.MODE === 'development'
const DEV_HTTP_FETCH = false // do network calls even in dev mode, to test that it works
const SHOW_BLOB_DOWNLOAD = false // isDev

const [DEFAULT_AUDIO_URL, DEFAULT_TRIM_POINTS] =
  isDev && !DEV_HTTP_FETCH
    ? // ['http://localhost:57915/The_Amen_Break.wav', [0, 0]]
      ['http://localhost:57915/The_Amen_Break%2C_in_context.ogg.mp3', [32.78, 20.31]]
    : [
        'https://upload.wikimedia.org/wikipedia/en/transcoded/8/80/The_Amen_Break%2C_in_context.ogg/The_Amen_Break%2C_in_context.ogg.mp3',
        [32.78, 20.22],
      ]

const DEFAULT_VIS_STYLE = 'saw'

export default function AudioPlotter() {
  // form state
  const [url, setUrl] = useState(DEFAULT_AUDIO_URL)
  const [imgHeight, setImgHeight] = useState(DEFAULT_HEIGHT)
  const [numBands, setNumBands] = useState(DEFAULT_BANDS)
  const [audioTrimPoints, setAudioTrimPoints] = useState(DEFAULT_TRIM_POINTS)
  const [audioTrimPointsDebounced, setAudioTrimPointsDebounced] = useState(DEFAULT_TRIM_POINTS)
  const [doNormalize, setDoNormalize] = useState(true)
  const [visStyle, setVisStyle] = useState(DEFAULT_VIS_STYLE)
  const [strokeWidth, setStrokeWidthRaw] = useState(DEFAULT_STROKE_WIDTH)
  const [addCaps, setAddCaps] = useState(true)

  // NOTE: The "Go" button is needed, because we can use Browser audio API only after a user interaction!
  const [runAnalysis, setRunAnalysis] = useState(false)
  // other state
  const [svgBlobURL, setSvgBlobURL] = useState<string | null>(null)
  const svgEl = useRef<SVGSVGElement>(null)

  // related fields:
  // * stroke width
  const maxStrokeWidth = calcMaxStrokeWidth(numBands)
  function setStrokeWidth(num: number) {
    setStrokeWidthRaw(num < maxStrokeWidth ? num : maxStrokeWidth)
  }
  useEffect(() => {
    if (strokeWidth > maxStrokeWidth) setStrokeWidthRaw(maxStrokeWidth)
  }, [numBands])

  // * audio trim points
  const debounceAudioTrimPoints = useCallback(
    debounce((atp: [number, number]) => setAudioTrimPointsDebounced(atp)),
    []
  )
  const onChangeTrimStart = (event: React.ChangeEvent<HTMLInputElement>, where: 'start' | 'end' = 'start') => {
    const val = Try(() => parseFloat(event.target.value)) ?? 0
    const newPoints: [number, number] = where === 'start' ? [val, audioTrimPoints[1]!] : [audioTrimPoints[0]!, val]
    setAudioTrimPoints(newPoints)
    debounceAudioTrimPoints(newPoints)
  }
  const onChangeTrimEnd = (event: React.ChangeEvent<HTMLInputElement>) => onChangeTrimStart(event, 'end')

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
          {({ isFetching, fetchError, buffer }) => {
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
                      onChange={(e) => setVisStyle(e.target.value as StyleType)}
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
                          onChange={(e) => setImgHeight(parseInt(e.target.value, 10))}
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
                          value={audioTrimPoints[0]!}
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
                          value={audioTrimPoints[1]!}
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
                      onChange={(e) => {
                        const num = parseFloat(e.target.value)
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
                          className={svgBlobURL ? 'btn btn-outline-dark' : 'btn btn-outline-warning disabled'}
                          target="_blank"
                          download={generateFilename(url, {
                            height: imgHeight,
                            bands: numBands,
                            trimStart: audioTrimPoints[0]!,
                            trimEnd: audioTrimPoints[1]!,
                            normalize: doNormalize,
                            addCaps: addCaps,
                          })}
                          href={svgBlobURL || undefined}
                          onClick={(e) => !svgBlobURL && e.preventDefault()}
                        >
                          Download SVG (from blob!)
                        </a>{' '}
                      </>
                    )}
                    <button
                      className="btn btn-outline-primary"
                      onClick={() =>
                        downloadSVGNodeInDOM(
                          generateFilename(url, {
                            height: imgHeight,
                            bands: numBands,
                            trimStart: audioTrimPoints[0]!,
                            trimEnd: audioTrimPoints[1]!,
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
                  trimPoints={audioTrimPointsDebounced as [number, number]}
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
                            style={visStyle as StyleType}
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

interface ErrorMessageProps {
  error: string
  children?: React.ReactNode
}

const ErrorMessage = ({ error, children }: ErrorMessageProps) => (
  <div className="card text-center text-dark bg-warning mb-3 m-auto" style={{ maxWidth: '42em' }}>
    <div className="card-body">
      <h5 className="card-title">Something went wrong…</h5>
      <pre className="card-text">{error}</pre>
      {children}
    </div>
  </div>
)

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  labelTxt: string
  helpTxt?: string
}

const FormField = ({ id, labelTxt, helpTxt, ...inputProps }: FormFieldProps) => (
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

interface NumberSliderInputProps extends Omit<FormFieldProps, 'helpTxt'> {
  id: string
  labelTxt: string
}

const NumberSliderInput = ({ id, labelTxt, ...inputProps }: NumberSliderInputProps) => (
  <div id={id} className="row mb-2">
    <div className="col">
      <FormField id={`${id}Range`} type="range" className="form-range" labelTxt={labelTxt} {...inputProps} />
    </div>
    <div className="col">
      <FormField id={`${id}Nr`} type="number" labelTxt="" {...inputProps} />
    </div>
  </div>
)

interface FileSettings {
  height: number
  bands: number
  trimStart: number
  trimEnd: number
  normalize: boolean
  addCaps: boolean
}

function generateFilename(audioUrl: string, settings: FileSettings): string {
  // Extract base filename from URL
  const urlPath = audioUrl.split('/').pop() || 'audioplot'
  const basename = urlPath.split('?')[0]!.replace(/\.[^.]+$/, '') // remove query params and extension
  const decodedBasename = decodeURIComponent(basename)

  // Normalize: lowercase, replace spaces/special chars with dashes, alphanumerics only
  const normalizedBasename = decodedBasename
    .toLowerCase()
    .replace(/\s+/g, '-') // spaces to dashes
    .replace(/[^a-z0-9-]/g, '-') // non-alphanumeric to dashes
    .replace(/-+/g, '-') // collapse multiple dashes
    .replace(/^-|-$/g, '') // remove leading/trailing dashes

  // Build settings string
  const h = `h${settings.height}`
  const b = `b${settings.bands}`
  const ts = `ts${settings.trimStart}`
  const te = `te${settings.trimEnd}`
  const norm = `norm${settings.normalize ? 'yes' : 'no'}`
  const caps = `caps${settings.addCaps ? 'yes' : 'no'}`

  return `audioplot-${normalizedBasename}-${h}-${b}-${ts}-${te}-${norm}-${caps}.svg`
}

function downloadSVGNodeInDOM(filename: string = 'audioplot.svg'): void {
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
