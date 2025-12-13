import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import SvgFromAudioPeaks, {
  STYLES,
  DEFAULT_STYLE,
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  DEFAULT_PADDING_X,
  MAX_HEIGHT,
  MIN_STROKE_WIDTH,
  MAX_STROKE_WIDTH,
  STROKE_WIDTH_STEP,
  calcMaxStrokeWidth,
  isStyleType,
  ensureStyleType,
} from './SvgFromAudioPeaks'

describe('SvgFromAudioPeaks constants', () => {
  it('has correct STYLES array', () => {
    expect(STYLES).toEqual(['zigzag', 'saw', 'bars'])
  })

  it('has correct DEFAULT_STYLE', () => {
    expect(DEFAULT_STYLE).toBe('saw')
  })

  it('has correct dimension constants', () => {
    expect(DEFAULT_HEIGHT).toBe(150)
    expect(DEFAULT_WIDTH).toBe(1000)
    expect(DEFAULT_PADDING_X).toBe(100)
    expect(MAX_HEIGHT).toBe(2048)
  })

  it('has correct stroke width constants', () => {
    expect(MIN_STROKE_WIDTH).toBe(0.1)
    expect(MAX_STROKE_WIDTH).toBe(100)
    expect(STROKE_WIDTH_STEP).toBe(0.1)
  })
})

describe('isStyleType', () => {
  it('returns true for valid styles', () => {
    expect(isStyleType('zigzag')).toBe(true)
    expect(isStyleType('saw')).toBe(true)
    expect(isStyleType('bars')).toBe(true)
  })

  it('returns false for invalid styles', () => {
    expect(isStyleType('invalid')).toBe(false)
    expect(isStyleType('')).toBe(false)
    expect(isStyleType(123)).toBe(false)
    expect(isStyleType(null)).toBe(false)
    expect(isStyleType(undefined)).toBe(false)
  })
})

describe('ensureStyleType', () => {
  it('returns valid style unchanged', () => {
    expect(ensureStyleType('zigzag')).toBe('zigzag')
    expect(ensureStyleType('saw')).toBe('saw')
    expect(ensureStyleType('bars')).toBe('bars')
  })

  it('returns default for invalid values', () => {
    expect(ensureStyleType('invalid')).toBe(DEFAULT_STYLE)
    expect(ensureStyleType(123)).toBe(DEFAULT_STYLE)
    expect(ensureStyleType(null)).toBe(DEFAULT_STYLE)
  })
})

describe('calcMaxStrokeWidth', () => {
  it('calculates max stroke width based on bands', () => {
    expect(calcMaxStrokeWidth(100)).toBeLessThanOrEqual(MAX_STROKE_WIDTH)
    expect(calcMaxStrokeWidth(1024)).toBeLessThanOrEqual(MAX_STROKE_WIDTH)
  })

  it('returns smaller values for more bands', () => {
    const maxFor100 = calcMaxStrokeWidth(100)
    const maxFor1000 = calcMaxStrokeWidth(1000)
    expect(maxFor1000).toBeLessThan(maxFor100)
  })

  it('never exceeds MAX_STROKE_WIDTH', () => {
    expect(calcMaxStrokeWidth(1)).toBe(MAX_STROKE_WIDTH)
    expect(calcMaxStrokeWidth(10)).toBeLessThanOrEqual(MAX_STROKE_WIDTH)
  })
})

describe('SvgFromAudioPeaks component', () => {
  const testPeaks = [0.2, 0.4, 0.6, 0.8, 1.0]
  const testBandPeaks = [{ name: 'Full', lowHz: 20, highHz: 20000, color: '#000000', peaks: testPeaks }]

  it('renders SVG element', async () => {
    const { container } = await render(
      <SvgFromAudioPeaks bandPeaks={testBandPeaks} height={DEFAULT_HEIGHT} style="saw" strokeWidth={1} />
    )

    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('applies correct width and height', async () => {
    const { container } = await render(
      <SvgFromAudioPeaks bandPeaks={testBandPeaks} height={200} style="saw" strokeWidth={1} />
    )

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe(String(DEFAULT_WIDTH))
    // Height includes padding
    expect(svg?.getAttribute('height')).toBe(String(200 + DEFAULT_PADDING_X))
  })

  it('renders zigzag style', async () => {
    const { container } = await render(
      <SvgFromAudioPeaks bandPeaks={testBandPeaks} height={DEFAULT_HEIGHT} style="zigzag" strokeWidth={1} />
    )

    // react-svg-path 2.0.0 uses <path> instead of <polyline>
    const path = container.querySelector('path')
    expect(path).toBeTruthy()
  })

  it('renders saw style', async () => {
    const { container } = await render(
      <SvgFromAudioPeaks bandPeaks={testBandPeaks} height={DEFAULT_HEIGHT} style="saw" strokeWidth={1} />
    )

    // react-svg-path 2.0.0 uses <path> instead of <polyline>
    const path = container.querySelector('path')
    expect(path).toBeTruthy()
  })

  it('renders bars style', async () => {
    const { container } = await render(
      <SvgFromAudioPeaks bandPeaks={testBandPeaks} height={DEFAULT_HEIGHT} style="bars" strokeWidth={1} />
    )

    const lines = container.querySelectorAll('line')
    expect(lines.length).toBeGreaterThan(0)
  })

  it('applies stroke width correctly', async () => {
    const strokeWidth = 5
    const { container } = await render(
      <SvgFromAudioPeaks bandPeaks={testBandPeaks} height={DEFAULT_HEIGHT} style="saw" strokeWidth={strokeWidth} />
    )

    // react-svg-path 2.0.0 uses <path> instead of <polyline>
    const path = container.querySelector('path')
    expect(path?.getAttribute('stroke-width')).toBe(String(strokeWidth))
  })

  it('applies stroke color', async () => {
    const { container } = await render(
      <SvgFromAudioPeaks bandPeaks={testBandPeaks} height={DEFAULT_HEIGHT} style="saw" strokeWidth={1} />
    )

    const group = container.querySelector('g')
    // react-svg-path 2.0.0 uses <path> instead of <polyline>
    const path = group?.querySelector('path')
    expect(path?.getAttribute('stroke')).toBe('#000000')
  })

  it('handles empty peaks array', async () => {
    const emptyBandPeaks = [{ name: 'Full', lowHz: 20, highHz: 20000, color: '#000000', peaks: [] }]
    const { container } = await render(
      <SvgFromAudioPeaks bandPeaks={emptyBandPeaks} height={DEFAULT_HEIGHT} style="saw" strokeWidth={1} />
    )

    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('handles withCaps=true', async () => {
    const { container} = await render(
      <SvgFromAudioPeaks bandPeaks={testBandPeaks} height={DEFAULT_HEIGHT} style="saw" strokeWidth={1} withCaps={true} />
    )

    // react-svg-path 2.0.0 uses <path> instead of <polyline>
    const path = container.querySelector('path')
    expect(path).toBeTruthy()
  })

  it('handles withCaps=false', async () => {
    const { container } = await render(
      <SvgFromAudioPeaks bandPeaks={testBandPeaks} height={DEFAULT_HEIGHT} style="saw" strokeWidth={1} withCaps={false} />
    )

    // react-svg-path 2.0.0 uses <path> instead of <polyline>
    const path = container.querySelector('path')
    expect(path).toBeTruthy()
  })

  it('accepts string height', async () => {
    const { container } = await render(
      <SvgFromAudioPeaks bandPeaks={testBandPeaks} height="200" style="saw" strokeWidth={1} />
    )

    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('accepts numeric height', async () => {
    const { container } = await render(<SvgFromAudioPeaks bandPeaks={testBandPeaks} height={200} style="saw" strokeWidth={1} />)

    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })
})
