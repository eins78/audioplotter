import React from 'react'

import { Svg, Polyline } from 'react-svg-path'

export const STYLES = [
  'zigzag',
  'saw',
  'bars',
  // 'quad'
] as const

export type StyleType = typeof STYLES[number]

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

interface SvgFromAudioPeaksProps extends Omit<React.SVGProps<SVGSVGElement>, 'style'> {
  peaks: number[]
  height: number | string
  withCaps?: boolean
  style: StyleType
  strokeWidth: number
}

export default React.forwardRef<SVGSVGElement, SvgFromAudioPeaksProps>(function SvgFromAudioPeaks(
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
  const targetHeight = typeof height === 'string' ? parseInt(height, 10) : height

  const totalWidth = peaks.length + (withCaps ? 2 : 0)
  const distanceX = targetWidth / totalWidth
  const middleY = targetHeight / 2
  const startPos = [0, middleY]
  const endPos = [targetWidth, middleY]

  const strokeProps = {
    stroke: '#222',
    strokeWidth: strokeWidth,
    fill: 'white',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  let points: number[][] = []
  let graph: React.ReactNode = null

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
    points = peaks.reduce<number[][]>((result, peak, index) => {
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

  if (style === 'bars') {
    const lines = peaks.map((peak, index) => {
      const xPos = index * distanceX + (withCaps ? distanceX : 0)
      const distance = (peak * targetHeight) / 2 // Divide by 2 since we want bars centered on middle
      const yUp = middleY - distance
      const yDown = middleY + distance
      return <line key={index} x1={xPos} y1={yUp} x2={xPos} y2={yDown} {...strokeProps} />
    })

    if (withCaps) {
      lines.unshift(
        <line key="start" x1={startPos[0]!} y1={startPos[1]!} x2={startPos[0]!} y2={startPos[1]!} {...strokeProps} />
      )
      lines.push(<line key="end" x1={endPos[0]!} y1={endPos[1]!} x2={endPos[0]!} y2={endPos[1]!} {...strokeProps} />)
    }

    graph = <>{lines}</>
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
