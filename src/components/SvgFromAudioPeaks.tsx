import React, { useMemo } from 'react'
import createDebug from 'debug'

import { Polyline } from 'react-svg-path'
import type { BandPeaks } from './AudioAnalyzer'

// Debug loggers - enable with localStorage.debug = 'audioplotter:*'
const debugRender = createDebug('audioplotter:svg:render')
const debugGeometry = createDebug('audioplotter:svg:geometry')
const debugBand = createDebug('audioplotter:svg:band')

// Style type with const array pattern
export const STYLES = ['zigzag', 'saw', 'bars'] as const
export type StyleType = (typeof STYLES)[number]
export const DEFAULT_STYLE: StyleType = 'saw'

export function isStyleType(value: unknown): value is StyleType {
  return typeof value === 'string' && STYLES.includes(value as StyleType)
}

export function ensureStyleType(value: unknown): StyleType {
  return isStyleType(value) ? value : DEFAULT_STYLE
}

// Blend mode type with const array pattern
export const BLEND_MODES = ['normal', 'multiply', 'screen', 'darken', 'lighten', 'overlay'] as const
export type BlendMode = (typeof BLEND_MODES)[number]
export const DEFAULT_BLEND_MODE: BlendMode = 'multiply'

export function isBlendMode(value: unknown): value is BlendMode {
  return typeof value === 'string' && BLEND_MODES.includes(value as BlendMode)
}

export function ensureBlendMode(value: unknown): BlendMode {
  return isBlendMode(value) ? value : DEFAULT_BLEND_MODE
}

export const DEFAULT_BACKGROUND_COLOR = '#FFFFFF'

export const DEFAULT_HEIGHT = 150
export const DEFAULT_WIDTH = 1000
export const DEFAULT_PADDING_X = 100
export const MAX_HEIGHT = 2048
export const DEFAULT_STROKE_WIDTH = 1
export const MIN_STROKE_WIDTH = 0.1
export const MAX_STROKE_WIDTH = 100
export const STROKE_WIDTH_STEP = 0.1

export function calcMaxStrokeWidth(numBands: number): number {
  const relativeWidth = Math.ceil((2 / numBands) * 100 * 100)
  return Math.min(MAX_STROKE_WIDTH, relativeWidth)
}

// Geometry types
interface PolylineGeometry {
  type: 'polyline'
  points: number[][]
}

interface BarLine {
  x: number
  yUp: number
  yDown: number
  key?: string
}

interface BarsGeometry {
  type: 'bars'
  lines: BarLine[]
}

type BandGeometry = PolylineGeometry | BarsGeometry | null

/**
 * Calculate path coordinates for a band graph (pure function, no JSX)
 * Separated from rendering to enable memoization of geometry calculations
 */
function calculatePathCoordinates(
  peaks: number[],
  style: StyleType,
  targetHeight: number,
  targetWidth: number,
  withCaps: boolean,
  spreadPeaks: boolean,
  bandIndex: number,
  numBands: number
): BandGeometry {
  const effectivePositions = spreadPeaks ? peaks.length * numBands : peaks.length
  const totalWidth = effectivePositions + (withCaps ? 2 : 0)
  const distanceX = targetWidth / totalWidth
  const middleY = targetHeight / 2
  const startPos: [number, number] = [0, middleY]
  const endPos: [number, number] = [targetWidth, middleY]

  if (style === 'zigzag') {
    let points: number[][] = peaks.map((peak, index) => {
      const isEven = index % 2 === 0
      const isUp = totalWidth % 2 === 0 ? isEven : !isEven
      const globalIndex = spreadPeaks ? index * numBands + bandIndex : index
      const xPos = globalIndex * distanceX + (withCaps ? distanceX : 0)
      const distance = peak * targetHeight
      const yPos = isUp ? middleY + distance : middleY - distance
      return [xPos, yPos]
    })

    if (withCaps) {
      points = [startPos, ...points, endPos]
    }

    return { type: 'polyline', points }
  }

  if (style === 'saw') {
    let points: number[][] = peaks.reduce<number[][]>((result, peak, index) => {
      const globalIndex = spreadPeaks ? index * numBands + bandIndex : index
      const xPos = globalIndex * distanceX + (withCaps ? distanceX : 0)
      const distance = peak * targetHeight
      const yUp = middleY - distance
      const yDown = middleY + distance
      return [...result, [xPos, yUp], [xPos, yDown]]
    }, [])

    if (withCaps) {
      points = [startPos, ...points, endPos]
    }

    return { type: 'polyline', points }
  }

  if (style === 'bars') {
    const lines: BarLine[] = peaks.map((peak, index) => {
      const globalIndex = spreadPeaks ? index * numBands + bandIndex : index
      const xPos = globalIndex * distanceX + (withCaps ? distanceX : 0)
      const distance = (peak * targetHeight) / 2
      const yUp = middleY - distance
      const yDown = middleY + distance
      return { x: xPos, yUp, yDown }
    })

    // Add caps as line data
    if (withCaps) {
      const [startX, startY] = startPos
      const [endX, endY] = endPos
      lines.unshift({ x: startX, yUp: startY, yDown: startY, key: 'start' })
      lines.push({ x: endX, yUp: endY, yDown: endY, key: 'end' })
    }

    return { type: 'bars', lines }
  }

  return null
}

// BandGroup component types
interface BandGroupProps {
  bandIndex: number
  name: string
  lowHz: number
  highHz: number
  color: string
  opacity: number
  geometry: BandGeometry
  strokeWidth: number
  blendMode: BlendMode
}

/**
 * Memoized component for rendering a single frequency band
 * Re-renders only when its props change (geometry, styling)
 */
const BandGroup = React.memo(function BandGroup({
  bandIndex,
  name,
  lowHz,
  highHz,
  color,
  opacity,
  geometry,
  strokeWidth,
  blendMode,
}: BandGroupProps) {
  debugBand('render band %d (%s) color=%s strokeWidth=%s', bandIndex, name, color, strokeWidth)

  const groupId = `band-${bandIndex + 1}-${name.toLowerCase()}-${lowHz}-${highHz}hz`

  const strokeProps = {
    stroke: color,
    strokeWidth: strokeWidth,
    fill: 'white',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (!geometry) return null

  let content: React.ReactNode = null
  if (geometry.type === 'polyline') {
    content = <Polyline points={geometry.points} {...strokeProps} />
  } else if (geometry.type === 'bars') {
    content = geometry.lines.map((line, i) => (
      <line key={line.key ?? i} x1={line.x} y1={line.yUp} x2={line.x} y2={line.yDown} {...strokeProps} />
    ))
  }

  return (
    <g id={groupId} opacity={opacity} style={{ mixBlendMode: blendMode }}>
      {content}
    </g>
  )
})

// SvgFromAudioPeaks component types
interface SvgFromAudioPeaksProps extends Omit<React.SVGProps<SVGSVGElement>, 'style'> {
  bandPeaks: BandPeaks[]
  height: number | string
  withCaps?: boolean
  style: StyleType
  strokeWidth: number
  backgroundColor?: string
  blendMode?: BlendMode
  spreadPeaks?: boolean
}

interface BandGeometryData {
  bandIndex: number
  name: string
  lowHz: number
  highHz: number
  geometry: BandGeometry
}

export default React.forwardRef<SVGSVGElement, SvgFromAudioPeaksProps>(function SvgFromAudioPeaks(
  {
    bandPeaks,
    height,
    withCaps = true,
    style,
    strokeWidth,
    backgroundColor = DEFAULT_BACKGROUND_COLOR,
    blendMode = DEFAULT_BLEND_MODE,
    spreadPeaks = false,
    ...restProps
  },
  ref
) {
  if (!height) return null
  if (!bandPeaks || bandPeaks.length === 0) return null

  const targetWidth = DEFAULT_WIDTH
  const paddingX = DEFAULT_PADDING_X
  const targetHeight = typeof height === 'string' ? parseInt(height, 10) : height

  if (!isStyleType(style)) return null

  const finalHeight = Math.ceil(targetHeight + paddingX)
  const numBands = bandPeaks.length

  debugRender('render SvgFromAudioPeaks height=%d style=%s strokeWidth=%s bands=%d', targetHeight, style, strokeWidth, numBands)

  // Memoize path coordinate calculations for all bands
  // Only recalculates when geometry-affecting props change
  // Does NOT recalculate for styling-only changes (strokeWidth, color, opacity, blendMode)
  const bandGeometries = useMemo<BandGeometryData[]>(() => {
    debugGeometry('RECALCULATING geometries for %d bands (style=%s height=%d)', numBands, style, targetHeight)
    return bandPeaks.map((band, index) => ({
      bandIndex: index,
      name: band.name,
      lowHz: band.lowHz,
      highHz: band.highHz,
      geometry: calculatePathCoordinates(band.peaks, style, targetHeight, targetWidth, withCaps, spreadPeaks, index, numBands),
    }))
  }, [bandPeaks, style, targetHeight, targetWidth, withCaps, spreadPeaks, numBands])

  return (
    <svg
      ref={ref}
      width={targetWidth}
      height={finalHeight}
      viewBox={[0, -Math.floor(paddingX / 2), targetWidth, finalHeight].join(' ')}
      {...restProps}
    >
      {/* Background */}
      <rect x="0" y={-Math.floor(paddingX / 2)} width={targetWidth} height={finalHeight} fill={backgroundColor} />
      {/* Frequency bands - uses memoized geometries */}
      {bandGeometries.map((bandGeo, index) => {
        const band = bandPeaks.at(index)
        if (!band) return null
        return (
          <BandGroup
            key={index}
            bandIndex={bandGeo.bandIndex}
            name={bandGeo.name}
            lowHz={bandGeo.lowHz}
            highHz={bandGeo.highHz}
            color={band.color}
            opacity={band.opacity ?? 1}
            geometry={bandGeo.geometry}
            strokeWidth={strokeWidth}
            blendMode={blendMode}
          />
        )
      })}
    </svg>
  )
})
