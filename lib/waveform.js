// from <https://github.com/antonKalinin/audio-waveform-svg-path/blob/1f3fc8ae3275dd9f2dc78491a5b88cfab58ea7f1/index.js>

import AudioCtx from 'audio-context'

const normalizeData = (filteredData) => {
  const multiplier = Math.pow(Math.max(...filteredData), -1)
  return filteredData.map((n) => n * multiplier)
}

function parseArrayBufferResponse(response) {
  if (!response.ok) {
    throw new Error(`${response.status} (${response.statusText})`)
  }

  return response.arrayBuffer()
}

export default class AudioSVGWaveform {
  constructor({ url, buffer, peaks }) {
    this.url = url || null
    this.audioBuffer = buffer || null
    this.peaks = peaks || 1000
    this.context = new AudioCtx({
      // offline: true // faster when server-side…
    })
  }

  _getPeaks(channelData, peaks, channelNumber) {
    const peaksCount = this.peaks
    const sampleSize = this.audioBuffer.length / peaksCount
    const sampleStep = ~~(sampleSize / 10) || 1
    const mergedPeaks = Array.isArray(peaks) ? peaks : []

    for (let peakNumber = 0; peakNumber < peaksCount; peakNumber++) {
      const start = ~~(peakNumber * sampleSize)
      const end = ~~(start + sampleSize)
      let min = channelData[0]
      let max = channelData[0]

      for (let sampleIndex = start; sampleIndex < end; sampleIndex += sampleStep) {
        const value = channelData[sampleIndex]

        if (value > max) {
          max = value
        }
        if (value < min) {
          min = value
        }
      }

      if (channelNumber === 0 || max > mergedPeaks[2 * peakNumber]) {
        mergedPeaks[2 * peakNumber] = max
      }

      if (channelNumber === 0 || min < mergedPeaks[2 * peakNumber + 1]) {
        mergedPeaks[2 * peakNumber + 1] = min
      }
    }

    return mergedPeaks
  }
  /**
   * @return {String} path of SVG path element
   */
  _svgPath(peaks) {
    const totalPeaks = peaks.length

    let d = ''
    // "for" is used for faster iteration
    for (let peakNumber = 0; peakNumber < totalPeaks; peakNumber++) {
      if (peakNumber % 2 === 0) {
        d += ` M${~~(peakNumber / 2)}, ${peaks[peakNumber]}`
      } else {
        d += ` L${~~(peakNumber / 2)}, ${peaks[peakNumber]}`
      }
    }
    return d
  }

  async loadFromUrl() {
    if (!this.url) {
      return null
    }

    const response = await fetch(this.url)
    const arrayBuffer = await parseArrayBufferResponse(response)

    this.audioBuffer = await this.context.decodeAudioData(arrayBuffer)

    return this.audioBuffer
  }

  getData(channelsPreprocess) {
    if (!this.audioBuffer) {
      console.log('No audio buffer to proccess')
      return null
    }

    // const numberOfChannels = this.audioBuffer.numberOfChannels
    const numberOfChannels = 1
    let channels = []

    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
      channels.push(this.audioBuffer.getChannelData(channelNumber))
    }

    if (typeof channelsPreprocess === 'function') {
      channels = channels.reduce(channelsPreprocess, [])
    }

    const peaks = normalizeData(
      channels.reduce(
        // change places of arguments in _getPeaks call
        (mergedPeaks, channelData, ...args) => this._getPeaks(channelData, mergedPeaks, ...args),
        []
      )
    )

    return { peaks: peaks, path: this._svgPath(peaks) }
  }
}
