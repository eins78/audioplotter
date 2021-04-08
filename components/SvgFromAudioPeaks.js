import React from 'react'

import { Svg, Polyline } from 'react-svg-path'

export const STYLES = ['zigzag', 'saw']
export const DEFAULT_WIDTH = 1000
export const DEFAULT_PADDING_X = 100

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
  let points = []

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
  }

  if (withCaps) {
    points = [startPos].concat(points, [endPos])
  }

  return (
    <svg
      ref={ref}
      width={targetWidth}
      height={targetHeight}
      viewBox={[0, -Math.floor(paddingX / 2), targetWidth, Math.floor(targetHeight + paddingX)].join(' ')}
      {...restProps}
    >
      <Polyline points={points} stroke="#222" strokeWidth={strokeWidth} fill="#ffffff" />
    </svg>
  )
})
