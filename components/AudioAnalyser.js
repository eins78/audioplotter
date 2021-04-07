// adapted from <https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/>

import React, { useState, useEffect, useRef } from 'react'
import AudioCtx from 'audio-context'
import promisify from 'pify'

export const MIN_LINES = 1
export const MAX_LINES = 2048
export const DEFAULT_LINES = 1024

export default function AudioAnalyzer({ url, lines = 100, normalize = true, children } = {}) {
  const [audioContext, setAudioContext] = useState(new AudioCtx())
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState(undefined)
  const buffer = useRef(new ArrayBuffer())
  const [peaks, setPeaks] = useState(undefined)

  useEffect(() => {
    if (!audioContext) setAudioContext(new AudioCtx())
  }, [])

  useEffect(
    async function fetchData() {
      setIsFetching(true)
      let buf, err
      try {
        const response = await fetch(url)
        buf = await response.arrayBuffer()
      } catch (error) {
        err = true
        setFetchError(error)
      }
      if (!err) buffer.current = buf
      setIsFetching(false)
    },
    [url]
  )

  useEffect(
    async function calculatePeaks() {
      if (!(audioContext && !isFetching && buffer.current && buffer.current.byteLength)) {
        return setPeaks(null)
      }
      // debugger
      // NOTE: fix for Safari which only supports the callback style
      const decodeAudioData = promisify(audioContext.decodeAudioData.bind(audioContext), { errorFirst: false })
      const audioData = await decodeAudioData(buffer.current.slice())
      const peaks = filterData(audioData, lines)
      setPeaks(normalize ? normalizeData(peaks) : peaks)
    },
    [url, lines, audioContext, isFetching, buffer]
  )

  const data = { peaks, error: fetchError }
  return typeof children !== 'function' ? null : children(data)
}

function filterData(audioBuffer, numSamples) {
  const rawData = audioBuffer.getChannelData(0) // We only need to work with one channel of data
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
