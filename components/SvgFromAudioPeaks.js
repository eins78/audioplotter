import React, { useMemo } from 'react'
import createDebug from 'debug'

import { Svg, Polyline, Quad } from 'react-svg-path'

// Debug loggers - enable with localStorage.debug = 'audioplotter:*'
const debugRender = createDebug('audioplotter:svg:render')
const debugGeometry = createDebug('audioplotter:svg:geometry')
const debugBand = createDebug('audioplotter:svg:band')

export const STYLES = [
  'zigzag',
  'saw',
  'bars',
  // 'quad'
]

export const BLEND_MODES = ['normal', 'multiply', 'screen', 'darken', 'lighten', 'overlay']
export const DEFAULT_BLEND_MODE = 'multiply'
export const DEFAULT_BACKGROUND_COLOR = '#FFFFFF'

export const DEFAULT_HEIGHT = 150
export const DEFAULT_WIDTH = 1000
export const DEFAULT_PADDING_X = 100
export const MAX_HEIGHT = 2048
export const DEFAULT_STROKE_WIDTH = 1
export const MIN_STROKE_WIDTH = 0.1
export const MAX_STROKE_WIDTH = 100
export const STROKE_WIDTH_STEP = 0.1

export function calcMaxStrokeWidth(numBands) {
  const relativeWidth = Math.ceil((2 / numBands) * 100 * 100)
  return Math.min(MAX_STROKE_WIDTH, relativeWidth)
}

/**
 * Calculate path coordinates for a band graph (pure function, no JSX)
 * Separated from rendering to enable memoization of geometry calculations
 * @returns Object with type ('polyline' | 'bars') and coordinate data
 */
function calculatePathCoordinates(peaks, style, targetHeight, targetWidth, withCaps, spreadPeaks, bandIndex, numBands) {
  const effectivePositions = spreadPeaks ? peaks.length * numBands : peaks.length
  const totalWidth = effectivePositions + (withCaps ? 2 : 0)
  const distanceX = targetWidth / totalWidth
  const middleY = targetHeight / 2
  const startPos = [0, middleY]
  const endPos = [targetWidth, middleY]

  if (style === 'zigzag') {
    let points = peaks.map((peak, index) => {
      const isEven = index % 2 === 0
      const isUp = totalWidth % 2 === 0 ? isEven : !isEven
      const globalIndex = spreadPeaks ? index * numBands + bandIndex : index
      const xPos = globalIndex * distanceX + (withCaps ? distanceX : 0)
      const distance = peak * targetHeight
      const yPos = isUp ? middleY + distance : middleY - distance
      return [xPos, yPos]
    })

    if (withCaps) {
      points = [startPos].concat(points, [endPos])
    }

    return { type: 'polyline', points }
  }

  if (style === 'saw') {
    let points = peaks.reduce((result, peak, index) => {
      const globalIndex = spreadPeaks ? index * numBands + bandIndex : index
      const xPos = globalIndex * distanceX + (withCaps ? distanceX : 0)
      const distance = peak * targetHeight
      const yUp = middleY - distance
      const yDown = middleY + distance
      return result.concat([
        [xPos, yUp],
        [xPos, yDown],
      ])
    }, [])

    if (withCaps) {
      points = [startPos].concat(points, [endPos])
    }

    return { type: 'polyline', points }
  }

  if (style === 'bars') {
    const lines = peaks.map((peak, index) => {
      const globalIndex = spreadPeaks ? index * numBands + bandIndex : index
      const xPos = globalIndex * distanceX + (withCaps ? distanceX : 0)
      const distance = (peak * targetHeight) / 2
      const yUp = middleY - distance
      const yDown = middleY + distance
      return { x: xPos, yUp, yDown }
    })

    // Add caps as line data
    if (withCaps) {
      lines.unshift({ x: startPos[0], yUp: startPos[1], yDown: startPos[1], key: 'start' })
      lines.push({ x: endPos[0], yUp: endPos[1], yDown: endPos[1], key: 'end' })
    }

    return { type: 'bars', lines }
  }

  return null
}

/**
 * Memoized component for rendering a single frequency band
 * Re-renders only when its props change (geometry, styling)
 */
const BandGroup = React.memo(function BandGroup({ bandIndex, name, lowHz, highHz, color, opacity, geometry, strokeWidth, blendMode }) {
  debugBand('render band %d (%s) color=%s strokeWidth=%s', bandIndex, name, color, strokeWidth)

  const groupId = `band-${bandIndex + 1}-${name.toLowerCase()}-${lowHz}-${highHz}hz`

  const strokeProps = {
    stroke: color,
    strokeWidth: strokeWidth,
    fill: 'white',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  let content = null
  if (geometry.type === 'polyline') {
    content = <Polyline points={geometry.points} {...strokeProps} />
  } else if (geometry.type === 'bars') {
    content = geometry.lines.map((line, i) => (
      <line key={line.key || i} x1={line.x} y1={line.yUp} x2={line.x} y2={line.yDown} {...strokeProps} />
    ))
  }

  return (
    <g id={groupId} opacity={opacity} style={{ mixBlendMode: blendMode }}>
      {content}
    </g>
  )
})

export default React.forwardRef(function SvgFromAudioPeaks(
  {
    bandPeaks, // Array of { name, lowHz, highHz, color, opacity, peaks }
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
  if (!height) throw new TypeError()
  if (!bandPeaks || bandPeaks.length === 0) return null

  const targetWidth = DEFAULT_WIDTH
  const paddingX = DEFAULT_PADDING_X
  const targetHeight = parseInt(height, 10)

  if (!STYLES.includes(style)) throw new TypeError()

  const finalHeight = Math.ceil(targetHeight + paddingX)
  const numBands = bandPeaks.length

  debugRender('render SvgFromAudioPeaks height=%d style=%s strokeWidth=%s bands=%d', targetHeight, style, strokeWidth, numBands)

  // Memoize path coordinate calculations for all bands
  // Only recalculates when geometry-affecting props change
  // Does NOT recalculate for styling-only changes (strokeWidth, color, opacity, blendMode)
  const bandGeometries = useMemo(() => {
    debugGeometry('RECALCULATING geometries for %d bands (style=%s height=%d)', numBands, style, targetHeight)
    return bandPeaks.map((band, index) => ({
      bandIndex: index,
      name: band.name,
      lowHz: band.lowHz,
      highHz: band.highHz,
      geometry: calculatePathCoordinates(
        band.peaks,
        style,
        targetHeight,
        targetWidth,
        withCaps,
        spreadPeaks,
        index,
        numBands
      ),
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
        const band = bandPeaks[index]
        return (
          <BandGroup
            key={index}
            bandIndex={bandGeo.bandIndex}
            name={bandGeo.name}
            lowHz={bandGeo.lowHz}
            highHz={bandGeo.highHz}
            color={band.color}
            opacity={band.opacity !== undefined ? band.opacity : 1}
            geometry={bandGeo.geometry}
            strokeWidth={strokeWidth}
            blendMode={blendMode}
          />
        )
      })}
    </svg>
  )
})
