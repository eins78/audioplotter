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

interface AudioBufferRenderProps {
  isFetching: boolean
  fetchError: string | undefined
  bufferLength: number
  buffer: ArrayBuffer | null
}

interface AudioBufferProps {
  url: string
  children: (props: AudioBufferRenderProps) => React.ReactNode
}

export function AudioBuffer({ url, children }: AudioBufferProps) {
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | undefined>(undefined)
  const buffer = useRef<ArrayBuffer | null>(new ArrayBuffer())
  const bufferLength = buffer.current ? buffer.current.byteLength : 0

  useEffect(() => {
    async function fetchData() {
      buffer.current = null
      setFetchError(undefined)
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
      if (!err && buf) buffer.current = buf
      setIsFetching(false)
    }
    fetchData()
  }, [url])

  return typeof children !== 'function'
    ? null
    : children({ isFetching, fetchError, bufferLength, buffer: buffer.current })
}

type TrimPoints = readonly [number, number]

interface AudioPeaksRenderProps {
  peaks: number[] | undefined
  decodeError: string | undefined
}

interface AudioPeaksProps {
  buffer: ArrayBuffer | null
  bands?: number
  trimPoints?: TrimPoints
  normalize?: boolean
  children: (props: AudioPeaksRenderProps) => React.ReactNode
}

export function AudioPeaks({ buffer, bands = 100, trimPoints = [0, 0], normalize = true, children }: AudioPeaksProps) {
  const [audioContext, setAudioContext] = useState<AudioContext | undefined>()
  const [decodeError, setDecodeError] = useState<string | undefined>(undefined)
  const [peaks, setPeaks] = useState<number[] | undefined>(undefined)

  const bufferLength = buffer ? buffer.byteLength : 0

  useEffect(() => {
    const ctx = new (AudioCtx as unknown as typeof AudioContext)()
    setAudioContext(ctx)
    return function cleanup() {
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {
          // Ignore errors on close
        })
      }
    }
  }, [])

  useEffect(() => {
    function calculatePeaks() {
      if (!(audioContext && bufferLength > 0 && buffer)) {
        return setPeaks(undefined)
      }

      // NOTE: no `await`, Safari only supports the callback style
      audioContext.decodeAudioData(
        buffer.slice(),
        function onSuccess(audioData: AudioBuffer) {
          const filteredData = filterData(audioData, bands, trimPoints)
          const peaks = normalize ? normalizeData(filteredData) : filteredData
          setPeaks(peaks)
          setDecodeError(undefined)
        },
        function onErr(err: DOMException | null) {
          setPeaks(undefined)
          setDecodeError(String(err))
        }
      )
    }
    calculatePeaks()
  }, [buffer, bands, trimPoints, normalize, audioContext])

  const data = { peaks, decodeError }
  return typeof children !== 'function' ? null : children(data)
}

function filterData(audioBufferTotal: AudioBuffer, numSamples: number, trimPoints: TrimPoints): number[] {
  const bufferLength = audioBufferTotal.length
  const bufferStart = Math.max(Math.floor((bufferLength / 100) * (trimPoints[0] ?? 0)), 1)
  const bufferEnd = Math.min(Math.ceil((bufferLength / 100) * (trimPoints[1] ?? 0)), bufferLength)

  if (bufferLength - bufferStart - bufferEnd < 1) return []

  const audioBuffer = AudioUtil.subbuffer(audioBufferTotal, bufferStart, -bufferEnd)
  const rawData = audioBuffer.getChannelData(0) // We only need to work with one channel of data

  if (numSamples > rawData.length) return []

  const blockSize = Math.floor(rawData.length / numSamples) // the number of samples in each subdivision

  const filteredData: number[] = []
  for (let i = 0; i < numSamples; i++) {
    let blockStart = blockSize * i // the location of the first sample in the block
    let sum = 0
    for (let j = 0; j < blockSize; j++) {
      const sample = rawData[blockStart + j]
      sum = sum + Math.abs(sample ?? 0) // find the sum of all the samples in the block
    }
    filteredData.push(sum / blockSize) // divide the sum by the block size to get the average
  }

  return filteredData
}

function normalizeData(filteredData: number[]): number[] {
  const multiplier = Math.pow(Math.max(...filteredData), -1)
  return filteredData.map((n) => n * multiplier)
}
