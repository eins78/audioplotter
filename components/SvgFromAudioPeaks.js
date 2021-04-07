import React from 'react'

import { Svg, Polyline } from 'react-svg-path'

export const STYLES = ['zigzag']

export default React.forwardRef(function SvgFromAudioPeaks(
  {
    peaks,
    height,
    withCaps = true, // wrap in start- and endpoint?
    style = STYLES[0],
    ...restProps
  },
  ref
) {
  if (!height) throw new TypeError()
  if (!STYLES.includes(style)) throw new TypeError()

  const totalWidth = peaks.length + 2
  const middleY = height / 2
  const startPos = [0, middleY]
  const endPos = [totalWidth, middleY]

  const peakPoints = peaks.map((peak, index) => {
    const isEven = index % 2 === 0
    const isUp = totalWidth % 2 === 0 ? isEven : !isEven // start up or down according to total width - less flicker when changing values?
    const xPos = index * 1 + (withCaps ? 1 : 0)
    const distance = peak * height
    const yPos = isUp ? middleY + distance : middleY - distance
    return [xPos, yPos]
  })

  const points = !withCaps ? peakPoints : [startPos].concat(peakPoints, [endPos])

  return (
    <svg ref={ref} width={totalWidth} height={height} viewBox={`0 0 ${totalWidth} ${height}`} {...restProps}>
      <Polyline points={points} stroke="#222" strokeWidth={1} fill="#ffffff" />
    </svg>
  )
})
