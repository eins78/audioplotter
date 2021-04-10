// adapted from <https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/>
// licensed under GPLv3, see LICENSE file in this repo and <https://codepen.io/matthewstrom/pen/mddOWWg>

import React, { useState, useEffect, useRef } from 'react'
import AudioCtx from 'audio-context'
import AudioUtil from 'audio-buffer-utils'

export const MIN_BANDS = 1
export const MAX_BANDS = 2048
export const DEFAULT_BANDS = 1024

// unused, just showing how to plug those 2 parts together…
// export default function AudioAnalyzer({ url, ...restProps }) {
//   return (
//     <AudioBuffer url={url}>
//       {({ isFetching, fetchError, bufferLength, buffer }) => {
//         if (isFetching) return 'loading…'
//         if (fetchError) return 'error!'
//         if (!(bufferLength > 0)) return 'empty!'
//         return <AudioPeaks buffer={buffer} {...restProps} />
//       }}
//     </AudioBuffer>
//   )
// }

export function AudioBuffer({ url, children } = {}) {
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState(undefined)
  const buffer = useRef(new ArrayBuffer())
  const bufferLength = buffer.current ? buffer.current.byteLength : 0

  useEffect(
    async function fetchData() {
      buffer.current = null
      setFetchError(null)
      setIsFetching(true)
      let buf, err
      try {
        const response = await fetch(url)
        const { ok, statusText } = response
        if (!ok) throw new Error(statusText)
        buf = await response.arrayBuffer()
      } catch (error) {
        err = true
        setFetchError(String(error))
      }
      if (!err) buffer.current = buf
      setIsFetching(false)
    },
    [url]
  )

  return typeof children !== 'function'
    ? null
    : children({ isFetching, fetchError, bufferLength, buffer: buffer.current })
}

export function AudioPeaks({ buffer, bands = 100, trimPoints = [0, 0], normalize = true, children } = {}) {
  const [audioContext, setAudioContext] = useState()
  const [decodeError, setDecodeError] = useState(undefined)
  const [peaks, setPeaks] = useState(undefined)

  const bufferLength = buffer ? buffer.byteLength : 0

  useEffect(() => {
    setAudioContext(new AudioCtx())
    return function cleanup() {
      if (audioContext && audioContext.close) audioContext.close()
    }
  }, [])

  useEffect(
    async function calculatePeaks() {
      if (!(audioContext && bufferLength > 0)) {
        return setPeaks(null)
      }
      // NOTE: no `await`, Safari only supports the callback style
      audioContext.decodeAudioData(
        buffer.slice(),
        function onSuccess(audioData) {
          const filteredData = filterData(audioData, bands, trimPoints)
          const peaks = normalize ? normalizeData(filteredData) : filteredData
          setPeaks(peaks)
          setDecodeError(null)
        },
        function onErr(err) {
          setPeaks(null)
          setDecodeError(String(err))
        }
      )
    },
    [buffer, bands, trimPoints, audioContext]
  )

  const data = { peaks, decodeError }
  return typeof children !== 'function' ? null : children(data)
}

function filterData(audioBufferTotal, numSamples, trimPoints) {
  const bufferLength = audioBufferTotal.length
  const bufferStart = Math.max(Math.floor((bufferLength / 100) * trimPoints[0]), 1)
  const bufferEnd = Math.min(Math.ceil((bufferLength / 100) * trimPoints[1]), bufferLength)

  if (bufferLength - bufferStart - bufferEnd < 1) return []

  const audioBuffer = AudioUtil.subbuffer(audioBufferTotal, bufferStart, -bufferEnd)
  const rawData = audioBuffer.getChannelData(0) // We only need to work with one channel of data

  if (numSamples > rawData.length) return []

  const blockSize = Math.floor(rawData.length / numSamples) // the number of samples in each subdivision

  const filteredData = []
  for (let i = 0; i < numSamples; i++) {
    let blockStart = blockSize * i // the location of the first sample in the block
    let sum = 0
    for (let j = 0; j < blockSize; j++) {
      sum = sum + Math.abs(rawData[blockStart + j]) // find the sum of all the samples in the block
    }
    filteredData.push(sum / blockSize) // divide the sum by the block size to get the average
  }

  return filteredData
}

function normalizeData(filteredData) {
  const multiplier = Math.pow(Math.max(...filteredData), -1)
  return filteredData.map((n) => n * multiplier)
}
