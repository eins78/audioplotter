// adapted from <https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/>

import React, { useState, useEffect, useMemo } from 'react'
import AudioCtx from 'audio-context'

const AudioAnalyzer = ({ url, lines = 100, children } = {}) => {
  const [audioContext, setAudioContext] = useState(new AudioCtx())
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState(undefined)
  const [buffer, setBuffer] = useState(new ArrayBuffer())
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
      if (!err) setBuffer(buf)
      setIsFetching(false)
    },
    [url]
  )

  useEffect(
    async function calculatePeaks() {
      if (audioContext && !isFetching && buffer && buffer.byteLength) {
        const audioData = await audioContext.decodeAudioData(buffer)
        const peaks = normalizeData(filterData(audioData, lines))
        setPeaks(peaks)
      }
    },
    [audioContext, url, lines, isFetching, buffer]
  )

  const data = { peaks, error: fetchError }

  return typeof children !== 'function' ? null : children(data)
}

export default AudioAnalyzer

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
