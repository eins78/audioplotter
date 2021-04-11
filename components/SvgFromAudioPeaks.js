import React from 'react'

import { Svg, Polyline, Quad } from 'react-svg-path'

export const STYLES = [
  'zigzag',
  'saw',
  // 'quad'
]
export const DEFAULT_WIDTH = 1000
export const DEFAULT_PADDING_X = 10
export const DEFAULT_HEIGHT = 100
export const MAX_HEIGHT = 2048
export const DEFAULT_STROKE_WIDTH = 1
export const MIN_STROKE_WIDTH = 0.1
export const MAX_STROKE_WIDTH = 100
export const STROKE_WIDTH_STEP = 0.1

export function calcMaxStrokeWidth(numBands) {
  const relativeWidth = Math.ceil((2 / numBands) * 100 * 100)
  return Math.min(MAX_STROKE_WIDTH, relativeWidth)
}

export default React.forwardRef(function SvgFromAudioPeaks(
  {
    peaks,
    height,
    withCaps = true, // wrap in start- and endpoint?
    style,
    strokeWidth,
    ...restProps
  },
  ref
) {
  if (!height) throw new TypeError()

  const targetWidth = DEFAULT_WIDTH
  const paddingX = DEFAULT_PADDING_X
  const targetHeight = parseInt(height, 10)

  const totalWidth = peaks.length + (withCaps ? 2 : 0)
  const distanceX = targetWidth / totalWidth
  const middleY = targetHeight / 2
  const startPos = [0, middleY]
  const endPos = [targetWidth, middleY]

  const strokeProps = {
    stroke: '#222',
    strokeWidth: strokeWidth,
    fill: 'white',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  let points = [],
    graph = null

  if (!STYLES.includes(style)) throw new TypeError()

  if (style === 'zigzag') {
    points = peaks.map((peak, index) => {
      const isEven = index % 2 === 0
      const isUp = totalWidth % 2 === 0 ? isEven : !isEven // start up or down according to total width - less flicker when changing values?
      const xPos = index * distanceX + (withCaps ? distanceX : 0)
      const distance = peak * targetHeight
      const yPos = isUp ? middleY + distance : middleY - distance
      return [xPos, yPos]
    })

    if (withCaps) {
      points = [startPos].concat(points, [endPos])
    }

    graph = <Polyline points={points} {...strokeProps} />
  }

  if (style === 'saw') {
    points = peaks.reduce((result, peak, index) => {
      const xPos = index * distanceX + (withCaps ? distanceX : 0)
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
    graph = <Polyline points={points} {...strokeProps} />
  }

  // if (style === 'quad') {
  //   points = peaks.reduce((result, peak, index) => {
  //     const xPos = index * distanceX + (withCaps ? distanceX : 0)
  //     const distance = peak * targetHeight
  //     const yUp = middleY - distance
  //     const yDown = middleY + distance
  //     return result.concat([
  //       [xPos, yUp],
  //       [xPos, yDown],
  //     ])
  //   }, [])

  //   if (withCaps) {
  //     points = [startPos].concat(points, [endPos])
  //   }

  //   graph = <Quad T={points} {...strokeProps} />
  // }

  const finalHeight = Math.ceil(targetHeight + paddingX)

  return (
    <svg
      // scale
      ref={ref}
      width={targetWidth}
      height={finalHeight}
      viewBox={[0, -Math.floor(paddingX / 2), targetWidth, finalHeight].join(' ')}
      {...restProps}
    >
      {graph}
    </svg>
  )
})
