// adapted from <https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/>
// licensed under GPLv3, see LICENSE file in this repo and <https://codepen.io/matthewstrom/pen/mddOWWg>

import React, { useState, useEffect, useRef } from 'react'
import AudioCtx from 'audio-context'
import AudioUtil from 'audio-buffer-utils'

export const MIN_BANDS = 1
export const MAX_BANDS = 2048
export const DEFAULT_BANDS = 1024

// Multiband frequency configuration
export const MIN_FREQUENCY_BANDS = 1
export const MAX_FREQUENCY_BANDS = 8
export const DEFAULT_FREQUENCY_BANDS = 1

export const DEFAULT_BAND_COLORS = [
  '#000000', // Black (backwards compatible)
  '#E74C3C', // Red
  '#3498DB', // Blue
  '#2ECC71', // Green
  '#F39C12', // Orange
  '#9B59B6', // Purple
  '#00BCD4', // Turquoise (Lamy ink)
  '#E91E63', // Pink/Magenta
]

export const FREQUENCY_PRESETS = {
  1: [{ name: 'Full', low: 20, high: 20000 }],
  2: [
    { name: 'Bass', low: 20, high: 250 },
    { name: 'Treble', low: 250, high: 20000 },
  ],
  3: [
    { name: 'Bass', low: 20, high: 250 },
    { name: 'Mid', low: 250, high: 4000 },
    { name: 'Treble', low: 4000, high: 20000 },
  ],
  4: [
    { name: 'Sub-Bass', low: 20, high: 60 },
    { name: 'Bass', low: 60, high: 250 },
    { name: 'Mid', low: 250, high: 4000 },
    { name: 'Treble', low: 4000, high: 20000 },
  ],
  5: [
    { name: 'Sub-Bass', low: 20, high: 60 },
    { name: 'Bass', low: 60, high: 250 },
    { name: 'Low-Mid', low: 250, high: 1000 },
    { name: 'High-Mid', low: 1000, high: 4000 },
    { name: 'Treble', low: 4000, high: 20000 },
  ],
  6: [
    { name: 'Sub-Bass', low: 20, high: 60 },
    { name: 'Bass', low: 60, high: 250 },
    { name: 'Low-Mid', low: 250, high: 500 },
    { name: 'Mid', low: 500, high: 2000 },
    { name: 'High-Mid', low: 2000, high: 6000 },
    { name: 'Treble', low: 6000, high: 20000 },
  ],
  7: [
    { name: 'Sub-Bass', low: 20, high: 60 },
    { name: 'Bass', low: 60, high: 250 },
    { name: 'Low-Mid', low: 250, high: 500 },
    { name: 'Mid', low: 500, high: 1000 },
    { name: 'Upper-Mid', low: 1000, high: 2000 },
    { name: 'High', low: 2000, high: 6000 },
    { name: 'Treble', low: 6000, high: 20000 },
  ],
  8: [
    { name: 'Sub-Bass', low: 20, high: 60 },
    { name: 'Bass', low: 60, high: 150 },
    { name: 'Low-Bass', low: 150, high: 250 },
    { name: 'Low-Mid', low: 250, high: 500 },
    { name: 'Mid', low: 500, high: 1000 },
    { name: 'Upper-Mid', low: 1000, high: 2000 },
    { name: 'High', low: 2000, high: 6000 },
    { name: 'Treble', low: 6000, high: 20000 },
  ],
}

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

/**
 * Filters audio buffer to specific frequency range using BiquadFilter
 * @param {AudioContext} audioContext
 * @param {AudioBuffer} audioBuffer - Decoded audio
 * @param {number} lowHz - Low frequency cutoff
 * @param {number} highHz - High frequency cutoff
 * @returns {Promise<Float32Array>} Filtered audio data
 */
async function filterAudioByFrequency(audioContext, audioBuffer, lowHz, highHz) {
  // Create offline context for processing
  const offlineContext = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate)

  // Create a new buffer for the offline context and copy data
  const newBuffer = offlineContext.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate)
  const sourceData = audioBuffer.getChannelData(0)
  const targetData = newBuffer.getChannelData(0)
  for (let i = 0; i < sourceData.length; i++) {
    targetData[i] = sourceData[i]
  }

  // Create source with the new buffer
  const source = offlineContext.createBufferSource()
  source.buffer = newBuffer

  // Apply appropriate filters
  if (lowHz === 20 && highHz === 20000) {
    // Full range - no filtering
    source.connect(offlineContext.destination)
  } else if (lowHz === 20) {
    // Lowpass only (high frequencies)
    const lowpass = offlineContext.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = highHz
    source.connect(lowpass).connect(offlineContext.destination)
  } else if (highHz === 20000) {
    // Highpass only (low frequencies)
    const highpass = offlineContext.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = lowHz
    source.connect(highpass).connect(offlineContext.destination)
  } else {
    // Bandpass (chain highpass + lowpass)
    const highpass = offlineContext.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = lowHz

    const lowpass = offlineContext.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = highHz

    source.connect(highpass).connect(lowpass).connect(offlineContext.destination)
  }

  source.start()
  const filteredBuffer = await offlineContext.startRendering()
  return filteredBuffer.getChannelData(0)
}

export function AudioBuffer({ url, file, children } = {}) {
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState(undefined)
  const buffer = useRef(new ArrayBuffer())
  const bufferLength = buffer.current ? buffer.current.byteLength : 0

  useEffect(
    async function fetchData() {
      if (!url && !file) return

      buffer.current = null
      setFetchError(null)
      setIsFetching(true)
      let buf, err

      try {
        if (file) {
          // Handle File object using FileReader
          buf = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.onerror = (e) => reject(new Error('Failed to read file'))
            reader.readAsArrayBuffer(file)
          })
        } else if (url) {
          // Handle URL using fetch
          const response = await fetch(url)
          const { ok, statusText } = response
          if (!ok) throw new Error(statusText)
          buf = await response.arrayBuffer()
        }
      } catch (error) {
        err = true
        setFetchError(String(error))
      }

      if (!err) buffer.current = buf
      setIsFetching(false)
    },
    [url, file]
  )

  return typeof children !== 'function'
    ? null
    : children({ isFetching, fetchError, bufferLength, buffer: buffer.current })
}

export function AudioPeaks({
  buffer,
  bands = 100,
  trimPoints = [0, 0],
  normalize = true,
  frequencyBands = null,
  children,
} = {}) {
  const [audioContext, setAudioContext] = useState()
  const [decodeError, setDecodeError] = useState(undefined)
  const [bandPeaks, setBandPeaks] = useState(undefined)

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
        return setBandPeaks(null)
      }

      // NOTE: no `await`, Safari only supports the callback style
      audioContext.decodeAudioData(
        buffer.slice(),
        async function onSuccess(audioData) {
          try {
            // If frequencyBands provided, process each band separately
            if (frequencyBands && frequencyBands.length > 0) {
              const allBandPeaks = []

              for (const band of frequencyBands) {
                // Filter audio by frequency range
                const filteredAudioData = await filterAudioByFrequency(
                  audioContext,
                  audioData,
                  band.lowHz,
                  band.highHz
                )

                // Create a real AudioBuffer from the filtered data
                const filteredBuffer = audioContext.createBuffer(1, filteredAudioData.length, audioData.sampleRate)
                filteredBuffer.getChannelData(0).set(filteredAudioData)

                // Apply time-domain sampling and trimming
                const timeSampledData = filterData(filteredBuffer, bands, trimPoints)
                const peaks = normalize ? normalizeData(timeSampledData) : timeSampledData

                allBandPeaks.push({
                  name: band.name,
                  lowHz: band.lowHz,
                  highHz: band.highHz,
                  color: band.color,
                  opacity: band.opacity,
                  peaks,
                })
              }

              setBandPeaks(allBandPeaks)
            } else {
              // Single band mode (backwards compatible)
              const filteredData = filterData(audioData, bands, trimPoints)
              const peaks = normalize ? normalizeData(filteredData) : filteredData
              setBandPeaks([
                {
                  name: 'Full',
                  lowHz: 20,
                  highHz: 20000,
                  color: '#000000',
                  peaks,
                },
              ])
            }
            setDecodeError(null)
          } catch (err) {
            setBandPeaks(null)
            setDecodeError(String(err))
          }
        },
        function onErr(err) {
          setBandPeaks(null)
          setDecodeError(String(err))
        }
      )
    },
    [buffer, bands, trimPoints, normalize, frequencyBands, audioContext]
  )

  const data = { bandPeaks, decodeError }
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
