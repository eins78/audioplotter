// adapted from <https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/>
// licensed under GPLv3, see LICENSE file in this repo and <https://codepen.io/matthewstrom/pen/mddOWWg>

import { useState, useEffect, useRef } from 'react'
import AudioCtx from 'audio-context'
import AudioUtil from 'audio-buffer-utils'
import createDebug from 'debug'

// Debug logger - enable with localStorage.debug = 'audioplotter:*'
const debugPeaks = createDebug('audioplotter:peaks')

export const MIN_BANDS = 1
export const MAX_BANDS = 2048
export const DEFAULT_BANDS = 1024

// Multiband frequency configuration
export const MIN_FREQUENCY_BANDS = 1
export const MAX_FREQUENCY_BANDS = 8
export const DEFAULT_FREQUENCY_BANDS = 1

export const DEFAULT_BAND_COLORS = Object.values({
  black: '#000000', // Single band only (backwards compatible)
  red: '#E74C3C',
  blue: '#3498DB',
  green: '#2ECC71',
  orange: '#F39C12',
  purple: '#9B59B6',
  turquoise: '#00BCD4', // Lamy ink
  pink: '#E91E63',
  yellow: '#FFC107',
})

// Type definitions
export interface FrequencyBandConfig {
  name: string
  low: number
  high: number
}

export interface FrequencyBandInput {
  name: string
  lowHz: number
  highHz: number
  color: string
  opacity?: number
}

export interface BandPeaks {
  name: string
  lowHz: number
  highHz: number
  color: string
  opacity?: number
  peaks: number[]
}

export type FrequencyBandCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export function isFrequencyBandCount(value: unknown): value is FrequencyBandCount {
  return typeof value === 'number' && value >= 1 && value <= 8 && Number.isInteger(value)
}

export function ensureFrequencyBandCount(value: unknown): FrequencyBandCount {
  return isFrequencyBandCount(value) ? value : DEFAULT_FREQUENCY_BANDS
}

export const FREQUENCY_PRESETS: Record<FrequencyBandCount, FrequencyBandConfig[]> = {
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

/**
 * Filters audio buffer to specific frequency range using BiquadFilter
 */
async function filterAudioByFrequency(
  _audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  lowHz: number,
  highHz: number
): Promise<Float32Array> {
  // Create offline context for processing
  const offlineContext = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate)

  // Create a new buffer for the offline context and copy data
  const newBuffer = offlineContext.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate)
  const sourceData = audioBuffer.getChannelData(0)
  const targetData = newBuffer.getChannelData(0)
  for (let i = 0; i < sourceData.length; i++) {
    const value = sourceData.at(i) ?? 0
    targetData[i] = value
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

// AudioBuffer component types
interface AudioBufferData {
  isFetching: boolean
  fetchError: string | null
  bufferLength: number
  buffer: ArrayBuffer | null
}

interface AudioBufferProps {
  url?: string
  file?: File | null
  children: (data: AudioBufferData) => React.ReactNode
}

export function AudioBuffer({ url, file, children }: AudioBufferProps) {
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const buffer = useRef<ArrayBuffer | null>(new ArrayBuffer(0))
  const bufferLength = buffer.current ? buffer.current.byteLength : 0

  useEffect(() => {
    if (!url && !file) return

    async function fetchData() {
      buffer.current = null
      setFetchError(null)
      setIsFetching(true)
      let buf: ArrayBuffer | undefined
      let err = false

      try {
        if (file) {
          // Handle File object using FileReader
          buf = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
              const result = e.target?.result
              if (result instanceof ArrayBuffer) {
                resolve(result)
              } else {
                reject(new Error('Failed to read file as ArrayBuffer'))
              }
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
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

      if (!err && buf) buffer.current = buf
      setIsFetching(false)
    }

    fetchData()
  }, [url, file])

  return typeof children !== 'function'
    ? null
    : children({ isFetching, fetchError, bufferLength, buffer: buffer.current })
}

// AudioPeaks component types
interface AudioPeaksData {
  bandPeaks: BandPeaks[] | null
  decodeError: string | null
}

interface AudioPeaksProps {
  buffer: ArrayBuffer | null
  bands?: number
  trimPoints?: [number, number]
  normalize?: boolean
  frequencyBands?: FrequencyBandInput[] | null
  children: (data: AudioPeaksData) => React.ReactNode
}

export function AudioPeaks({
  buffer,
  bands = 100,
  trimPoints = [0, 0],
  normalize = true,
  frequencyBands = null,
  children,
}: AudioPeaksProps) {
  const [audioContext, setAudioContext] = useState<AudioContext | undefined>(undefined)
  const [decodeError, setDecodeError] = useState<string | null>(null)
  const [bandPeaks, setBandPeaks] = useState<BandPeaks[] | null>(null)

  const bufferLength = buffer ? buffer.byteLength : 0

  useEffect(() => {
    setAudioContext(new AudioCtx())
    return function cleanup() {
      if (audioContext?.close) audioContext.close()
    }
  }, [])

  useEffect(() => {
    debugPeaks(
      'RECALCULATING peaks (bands=%d normalize=%s frequencyBands=%s)',
      bands,
      normalize,
      frequencyBands ? frequencyBands.length : 0
    )

    if (!(audioContext && bufferLength > 0 && buffer)) {
      setBandPeaks(null)
      return
    }

    // NOTE: no `await`, Safari only supports the callback style
    audioContext.decodeAudioData(
      buffer.slice(),
      async function onSuccess(audioData: AudioBuffer) {
        try {
          // If frequencyBands provided, process each band separately
          if (frequencyBands && frequencyBands.length > 0) {
            const allBandPeaks: BandPeaks[] = []

            for (const band of frequencyBands) {
              // Filter audio by frequency range
              const filteredAudioData = await filterAudioByFrequency(audioContext, audioData, band.lowHz, band.highHz)

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
      function onErr(err: DOMException) {
        setBandPeaks(null)
        setDecodeError(String(err))
      }
    )
  }, [buffer, bands, trimPoints, normalize, frequencyBands, audioContext, bufferLength])

  const data: AudioPeaksData = { bandPeaks, decodeError }
  return typeof children !== 'function' ? null : children(data)
}

export function filterData(audioBufferTotal: AudioBuffer, numSamples: number, trimPoints: [number, number]): number[] {
  const [trimStart = 0, trimEnd = 0] = trimPoints
  const bufferLength = audioBufferTotal.length
  const bufferStart = Math.max(Math.floor((bufferLength / 100) * trimStart), 1)
  const bufferEnd = Math.min(Math.ceil((bufferLength / 100) * trimEnd), bufferLength)

  if (bufferLength - bufferStart - bufferEnd < 1) return []

  const audioBuffer = AudioUtil.subbuffer(audioBufferTotal, bufferStart, -bufferEnd)
  const rawData = audioBuffer.getChannelData(0) // We only need to work with one channel of data

  if (numSamples > rawData.length) return []

  const blockSize = Math.floor(rawData.length / numSamples) // the number of samples in each subdivision

  const filteredData: number[] = []
  for (let i = 0; i < numSamples; i++) {
    const blockStart = blockSize * i // the location of the first sample in the block
    let sum = 0
    for (let j = 0; j < blockSize; j++) {
      sum = sum + Math.abs(rawData.at(blockStart + j) ?? 0) // find the sum of all the samples in the block
    }
    filteredData.push(sum / blockSize) // divide the sum by the block size to get the average
  }

  return filteredData
}

export function normalizeData(filteredData: number[]): number[] {
  const multiplier = Math.pow(Math.max(...filteredData), -1)
  return filteredData.map((n) => n * multiplier)
}
