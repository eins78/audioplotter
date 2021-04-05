import React from 'react'

import { Svg, Polyline } from 'react-svg-path'

export default function SvgFromAudioPeaks({ peaks }) {
  const height = 100
  const points = peaks.map((peak, index) => {
    const isEven = index % 2 === 0
    const xPos = index * 1
    // const yPos = isEven ? peak * height : height - peak * height
    // const yPos = height / 2 + peak * height
    const yPos = isEven ? height / 2 + peak * height : height / 2 - peak * height
    // console.log([index, peak, xPos, yPos])
    return [xPos, yPos]
  })
  return (
    <Svg width={'100%'} height={height} scale>
      <Polyline points={points} stroke="#222" strokeWidth={1} fill="#ffffff" />
    </Svg>
  )
}
