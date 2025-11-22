import React from 'react'

import { Svg, Polyline, Quad } from 'react-svg-path'

export const STYLES = [
  'zigzag',
  'saw',
  'bars',
  // 'quad'
]

export const BLEND_MODES = ['normal', 'multiply', 'screen', 'darken', 'lighten', 'overlay']
export const DEFAULT_BLEND_MODE = 'normal'
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

function renderBandGraph(peaks, style, targetHeight, targetWidth, withCaps, strokeWidth, color, spreadPeaks = false, bandIndex = 0, numBands = 1) {
  const effectivePositions = spreadPeaks ? peaks.length * numBands : peaks.length
  const totalWidth = effectivePositions + (withCaps ? 2 : 0)
  const distanceX = targetWidth / totalWidth
  const middleY = targetHeight / 2
  const startPos = [0, middleY]
  const endPos = [targetWidth, middleY]

  const strokeProps = {
    stroke: color,
    strokeWidth: strokeWidth,
    fill: 'white',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  let points = []

  if (style === 'zigzag') {
    points = peaks.map((peak, index) => {
      const isEven = index % 2 === 0
      const isUp = totalWidth % 2 === 0 ? isEven : !isEven
      const globalIndex = spreadPeaks ? (index * numBands) + bandIndex : index
      const xPos = globalIndex * distanceX + (withCaps ? distanceX : 0)
      const distance = peak * targetHeight
      const yPos = isUp ? middleY + distance : middleY - distance
      return [xPos, yPos]
    })

    if (withCaps) {
      points = [startPos].concat(points, [endPos])
    }

    return <Polyline points={points} {...strokeProps} />
  }

  if (style === 'saw') {
    points = peaks.reduce((result, peak, index) => {
      const globalIndex = spreadPeaks ? (index * numBands) + bandIndex : index
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
    return <Polyline points={points} {...strokeProps} />
  }

  if (style === 'bars') {
    const lines = peaks.map((peak, index) => {
      const globalIndex = spreadPeaks ? (index * numBands) + bandIndex : index
      const xPos = globalIndex * distanceX + (withCaps ? distanceX : 0)
      const distance = (peak * targetHeight) / 2
      const yUp = middleY - distance
      const yDown = middleY + distance
      return <line key={index} x1={xPos} y1={yUp} x2={xPos} y2={yDown} {...strokeProps} />
    })

    if (withCaps) {
      lines.unshift(
        <line key="start" x1={startPos[0]} y1={startPos[1]} x2={startPos[0]} y2={startPos[1]} {...strokeProps} />
      )
      lines.push(<line key="end" x1={endPos[0]} y1={endPos[1]} x2={endPos[0]} y2={endPos[1]} {...strokeProps} />)
    }

    return <>{lines}</>
  }

  return null
}

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

  return (
    <svg
      ref={ref}
      width={targetWidth}
      height={finalHeight}
      viewBox={[0, -Math.floor(paddingX / 2), targetWidth, finalHeight].join(' ')}
      {...restProps}
    >
      {/* Background */}
      <rect
        x="0"
        y={-Math.floor(paddingX / 2)}
        width={targetWidth}
        height={finalHeight}
        fill={backgroundColor}
      />
      {/* Frequency bands */}
      {bandPeaks.map((band, index) => {
        const groupId = `band-${index + 1}-${band.name.toLowerCase()}-${band.lowHz}-${band.highHz}hz`
        const graph = renderBandGraph(
          band.peaks,
          style,
          targetHeight,
          targetWidth,
          withCaps,
          strokeWidth,
          band.color,
          spreadPeaks,
          index,
          bandPeaks.length
        )
        const opacity = band.opacity !== undefined ? band.opacity : 1

        return (
          <g key={index} id={groupId} opacity={opacity} style={{ mixBlendMode: blendMode }}>
            {graph}
          </g>
        )
      })}
    </svg>
  )
})
